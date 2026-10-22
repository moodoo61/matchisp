package live.zerolag.match.calltest.sip

import android.content.Context
import live.zerolag.match.calltest.webrtc.WebRtcSession
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.webrtc.SessionDescription
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

enum class RegState { Idle, Connecting, Registered, Failed }
enum class CallState { Idle, Dialing, Ringing, Active, Ended }

class Softphone(
    context: Context,
    private val wsUrl: String,
    private val sipDomain: String,
    private val onLog: (String) -> Unit = {},
    private val onReg: (RegState, String?) -> Unit = { _, _ -> },
    private val onCall: (CallState, String?) -> Unit = { _, _ -> },
    private val onIncoming: (String) -> Unit = {},
) {
    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val client = OkHttpClient()
    private val webrtc = WebRtcSession(appContext)
    private val cseq = AtomicInteger(1)
    private var socket: WebSocket? = null
    private var extension = ""
    private var password = ""
    private var callIdReg = ""
    private var fromTag = ""
    private var activeCallId: String? = null
    private var activeToTag: String? = null
    private var activeInvite: SipMessage? = null
    private val waiters = ConcurrentHashMap<String, (SipMessage) -> Unit>()

    fun register(ext: String, pass: String) {
        extension = ext.trim()
        password = pass
        onReg(RegState.Connecting, null)
        disconnectSocket()
        val req = Request.Builder().url(wsUrl).header("Sec-WebSocket-Protocol", "sip").build()
        socket = client.newWebSocket(req, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                onLog("WS مفتوح")
                scope.launch { sendRegister(authHeader = null) }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                scope.launch { handleIncoming(text) }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                onLog("WS فشل: ${t.message}")
                onReg(RegState.Failed, t.message)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                onLog("WS أُغلق")
                if (extension.isNotEmpty()) onReg(RegState.Idle, reason)
            }
        })
    }

    fun unregister() {
        scope.launch {
            try {
                if (socket != null && extension.isNotEmpty()) {
                    sendRegister(authHeader = null, expires = 0)
                }
            } catch (_: Exception) {
            }
            disconnectSocket()
            extension = ""
            onReg(RegState.Idle, null)
        }
    }

    fun dial(destination: String) {
        scope.launch {
            try {
                onCall(CallState.Dialing, destination)
                webrtc.createPeer()
                val local = webrtc.createOffer()
                val callId = newCallId()
                activeCallId = callId
                fromTag = newTag()
                val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
                val seq = cseq.getAndIncrement()
                val sdp = local.description
                val msg = buildInvite(destination, callId, branch, seq, sdp, auth = null)
                val resp = sendAndWaitFinal(msg, callId) { code ->
                    if (code in 100..199) onCall(CallState.Ringing, destination)
                }
                handleInviteFinal(destination, callId, resp, sdp)
            } catch (e: Exception) {
                onLog("فشل الاتصال: ${e.message}")
                onCall(CallState.Ended, e.message)
                webrtc.closePeer()
            }
        }
    }

    fun answer() {
        scope.launch {
            val invite = activeInvite ?: return@launch
            try {
                webrtc.createPeer()
                val remoteSdp = invite.body
                webrtc.setRemoteDescription(
                    SessionDescription(SessionDescription.Type.OFFER, remoteSdp),
                )
                val answer = webrtc.createAnswer()
                val callId = invite.header("Call-ID") ?: return@launch
                activeCallId = callId
                val to = invite.header("To") ?: ""
                val from = invite.header("From") ?: ""
                val via = invite.header("Via") ?: ""
                val cseqH = invite.header("CSeq") ?: "1 INVITE"
                fromTag = newTag()
                val body = answer.description
                val headers = linkedMapOf(
                    "Via" to via,
                    "From" to from,
                    "To" to "$to;tag=$fromTag",
                    "Call-ID" to callId,
                    "CSeq" to cseqH,
                    "Contact" to contactUri(),
                    "Content-Type" to "application/sdp",
                    "Content-Length" to body.toByteArray().size.toString(),
                )
                sendRaw(SipMessage("SIP/2.0 200 OK", headers, body).toWire())
                onCall(CallState.Active, invite.header("From"))
            } catch (e: Exception) {
                onLog("فشل القبول: ${e.message}")
                reject()
            }
        }
    }

    fun reject() {
        val invite = activeInvite ?: return
        val callId = invite.header("Call-ID") ?: return
        val headers = linkedMapOf(
            "Via" to (invite.header("Via") ?: ""),
            "From" to (invite.header("From") ?: ""),
            "To" to (invite.header("To") ?: ""),
            "Call-ID" to callId,
            "CSeq" to (invite.header("CSeq") ?: "1 INVITE"),
            "Content-Length" to "0",
        )
        sendRaw(SipMessage("SIP/2.0 486 Busy Here", headers).toWire())
        activeInvite = null
        webrtc.closePeer()
        onCall(CallState.Ended, null)
    }

    fun hangup() {
        scope.launch {
            val callId = activeCallId
            if (callId != null && extension.isNotEmpty()) {
                try {
                    val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
                    val seq = cseq.getAndIncrement()
                    val toUri = "sip:${extractUser(activeInvite?.header("From"))}@$sipDomain"
                    val headers = linkedMapOf(
                        "Via" to "SIP/2.0/WS $sipDomain;branch=$branch",
                        "From" to "<sip:$extension@$sipDomain>;tag=$fromTag",
                        "To" to "<$toUri>${activeToTag?.let { ";tag=$it" } ?: ""}",
                        "Call-ID" to callId,
                        "CSeq" to "$seq BYE",
                        "Max-Forwards" to "70",
                        "Content-Length" to "0",
                    )
                    sendRaw(SipMessage("BYE sip:$extension@$sipDomain SIP/2.0", headers).toWire())
                } catch (_: Exception) {
                }
            }
            activeCallId = null
            activeInvite = null
            webrtc.closePeer()
            onCall(CallState.Ended, null)
        }
    }

    fun setMuted(mute: Boolean) = webrtc.setMuted(mute)
    fun isMuted(): Boolean = webrtc.isMuted()

    fun dispose() {
        unregister()
        webrtc.dispose()
        scope.cancel()
        client.dispatcher.executorService.shutdown()
    }

    private suspend fun handleInviteFinal(
        destination: String,
        callId: String,
        first: SipMessage,
        sdp: String,
    ) {
        var resp = first
        if (resp.statusCode == 401 || resp.statusCode == 407) {
            val authHeaderName =
                if (resp.statusCode == 401) "WWW-Authenticate" else "Proxy-Authenticate"
            val challenge = resp.header(authHeaderName) ?: error("لا يوجد تحدي مصادقة")
            val auth = SipDigest.authorize(
                username = extension,
                password = password,
                method = "INVITE",
                uri = "sip:$destination@$sipDomain",
                wwwAuthenticate = challenge,
            )
            val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
            val seq = cseq.getAndIncrement()
            val msg = buildInvite(destination, callId, branch, seq, sdp, auth = auth)
            resp = sendAndWaitFinal(msg, callId) { code ->
                if (code in 100..199) onCall(CallState.Ringing, destination)
            }
        }
        when (resp.statusCode) {
            in 200..299 -> {
                activeToTag = extractTag(resp.header("To"))
                val remote = resp.body
                if (remote.isNotBlank()) {
                    webrtc.setRemoteDescription(
                        SessionDescription(SessionDescription.Type.ANSWER, remote),
                    )
                }
                val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
                val ack = linkedMapOf(
                    "Via" to "SIP/2.0/WS $sipDomain;branch=$branch",
                    "From" to "<sip:$extension@$sipDomain>;tag=$fromTag",
                    "To" to (resp.header("To") ?: ""),
                    "Call-ID" to callId,
                    "CSeq" to "${resp.header("CSeq")?.substringBefore(' ') ?: "1"} ACK",
                    "Max-Forwards" to "70",
                    "Content-Length" to "0",
                )
                sendRaw(SipMessage("ACK sip:$destination@$sipDomain SIP/2.0", ack).toWire())
                onCall(CallState.Active, destination)
            }
            else -> {
                onCall(CallState.Ended, resp.startLine)
                webrtc.closePeer()
            }
        }
    }

    private suspend fun sendRegister(authHeader: String?, expires: Int = 600) {
        callIdReg = callIdReg.ifBlank { newCallId() }
        fromTag = fromTag.ifBlank { newTag() }
        val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
        val seq = cseq.getAndIncrement()
        val uri = "sip:$sipDomain"
        val headers = linkedMapOf(
            "Via" to "SIP/2.0/WS $sipDomain;branch=$branch",
            "From" to "<sip:$extension@$sipDomain>;tag=$fromTag",
            "To" to "<sip:$extension@$sipDomain>",
            "Call-ID" to callIdReg,
            "CSeq" to "$seq REGISTER",
            "Contact" to contactUri(),
            "Expires" to expires.toString(),
            "Allow" to "INVITE,ACK,CANCEL,BYE,OPTIONS,MESSAGE,NOTIFY",
            "Max-Forwards" to "70",
            "User-Agent" to "MatchCallTest/1.0",
            "Content-Length" to "0",
        )
        if (authHeader != null) headers["Authorization"] = authHeader
        val msg = SipMessage("REGISTER $uri SIP/2.0", headers)
        val resp = sendAndWaitFinal(msg, callIdReg)
        when (resp.statusCode) {
            401, 407 -> {
                val challenge = resp.header("WWW-Authenticate")
                    ?: resp.header("Proxy-Authenticate")
                    ?: error("لا يوجد تحدي")
                val auth = SipDigest.authorize(
                    username = extension,
                    password = password,
                    method = "REGISTER",
                    uri = uri,
                    wwwAuthenticate = challenge,
                )
                sendRegister(auth, expires)
            }
            in 200..299 -> {
                if (expires == 0) onReg(RegState.Idle, null)
                else onReg(RegState.Registered, null)
            }
            else -> onReg(RegState.Failed, resp.startLine)
        }
    }

    private suspend fun handleIncoming(text: String) {
        val msg = SipMessage.parse(text) ?: return
        onLog("← ${msg.startLine}")
        val callId = msg.header("Call-ID")
        if (!msg.isRequest && callId != null) {
            waiters.remove(callId)?.invoke(msg)
            return
        }
        when (msg.method) {
            "INVITE" -> {
                activeInvite = msg
                val from = extractUser(msg.header("From"))
                onIncoming(from)
                onCall(CallState.Ringing, from)
                // 100 Trying + 180 Ringing
                replySimple(msg, "100 Trying")
                replySimple(msg, "180 Ringing")
            }
            "BYE" -> {
                replySimple(msg, "200 OK")
                activeCallId = null
                activeInvite = null
                webrtc.closePeer()
                onCall(CallState.Ended, null)
            }
            "ACK" -> { /* ignore */ }
            "OPTIONS", "NOTIFY" -> replySimple(msg, "200 OK")
            "CANCEL" -> {
                replySimple(msg, "200 OK")
                activeInvite = null
                onCall(CallState.Ended, null)
            }
        }
    }

    private fun replySimple(req: SipMessage, status: String) {
        val headers = linkedMapOf(
            "Via" to (req.header("Via") ?: ""),
            "From" to (req.header("From") ?: ""),
            "To" to (req.header("To") ?: ""),
            "Call-ID" to (req.header("Call-ID") ?: ""),
            "CSeq" to (req.header("CSeq") ?: ""),
            "Content-Length" to "0",
        )
        sendRaw(SipMessage("SIP/2.0 $status", headers).toWire())
    }

    private fun buildInvite(
        destination: String,
        callId: String,
        branch: String,
        seq: Int,
        sdp: String,
        auth: String?,
    ): SipMessage {
        val headers = linkedMapOf(
            "Via" to "SIP/2.0/WS $sipDomain;branch=$branch",
            "From" to "<sip:$extension@$sipDomain>;tag=$fromTag",
            "To" to "<sip:$destination@$sipDomain>",
            "Call-ID" to callId,
            "CSeq" to "$seq INVITE",
            "Contact" to contactUri(),
            "Content-Type" to "application/sdp",
            "Max-Forwards" to "70",
            "User-Agent" to "MatchCallTest/1.0",
            "Content-Length" to sdp.toByteArray().size.toString(),
        )
        if (auth != null) headers["Authorization"] = auth
        return SipMessage("INVITE sip:$destination@$sipDomain SIP/2.0", headers, sdp)
    }

    private fun contactUri(): String =
        "<sip:$extension@$sipDomain;transport=ws>"

    private suspend fun sendAndWaitFinal(
        msg: SipMessage,
        callId: String,
        onProvisional: (Int) -> Unit = {},
    ): SipMessage =
        withContext(Dispatchers.IO) {
            suspendCancellableCoroutine { cont ->
                waiters[callId] = handler@{ response ->
                    val code = response.statusCode ?: return@handler
                    if (code < 200) {
                        onProvisional(code)
                        return@handler
                    }
                    if (cont.isActive) {
                        waiters.remove(callId)
                        cont.resume(response)
                    }
                }
                cont.invokeOnCancellation { waiters.remove(callId) }
                try {
                    sendRaw(msg.toWire())
                } catch (e: Exception) {
                    waiters.remove(callId)
                    if (cont.isActive) cont.resumeWithException(e)
                }
            }
        }

    private fun sendRaw(wire: String) {
        onLog("→ ${wire.lineSequence().firstOrNull()}")
        val ok = socket?.send(wire) == true
        if (!ok) throw IllegalStateException("تعذر الإرسال عبر WebSocket")
    }

    private fun disconnectSocket() {
        socket?.close(1000, "bye")
        socket = null
        waiters.clear()
    }

    private fun newCallId() = UUID.randomUUID().toString()
    private fun newTag() = UUID.randomUUID().toString().take(8)

    private fun extractTag(toHeader: String?): String? {
        if (toHeader == null) return null
        val m = Regex("""tag=([^;>\s]+)""").find(toHeader)
        return m?.groupValues?.getOrNull(1)
    }

    private fun extractUser(fromHeader: String?): String {
        if (fromHeader.isNullOrBlank()) return "?"
        val m = Regex("""sip:([^@>;]+)""").find(fromHeader)
        return m?.groupValues?.getOrNull(1) ?: fromHeader
    }
}
