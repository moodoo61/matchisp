package live.zerolag.match.calltest.sip

import android.content.Context
import android.util.Log
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
enum class CallState { Idle, Dialing, Ringing, Incoming, Active, Ended }

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
    private val client = OkHttpClient.Builder()
        .pingInterval(20, java.util.concurrent.TimeUnit.SECONDS)
        .build()
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

    val currentExtension: String get() = extension
    val isRegistered: Boolean get() = socket != null && extension.isNotEmpty()

    fun register(ext: String, pass: String) {
        extension = ext.trim()
        password = pass
        onReg(RegState.Connecting, null)
        disconnectSocket(clearExtension = false)
        val req = Request.Builder()
            .url(wsUrl)
            .header("Sec-WebSocket-Protocol", "sip")
            .build()
        socket = client.newWebSocket(req, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                onLog("WS مفتوح")
                scope.launch { sendRegister(authHeader = null) }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                // قد تصل أكثر من رسالة SIP في إطار واحد
                val chunks = splitSipMessages(text)
                for (chunk in chunks) {
                    scope.launch { handleIncoming(chunk) }
                }
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
            disconnectSocket(clearExtension = true)
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
                    if (code in 180..189) onCall(CallState.Ringing, destination)
                }
                handleInviteFinal(destination, callId, resp, sdp)
            } catch (e: Exception) {
                Log.e(TAG, "فشل الاتصال", e)
                onLog("فشل الاتصال: ${e.message}")
                onCall(CallState.Ended, e.message)
                webrtc.closePeer()
                activeCallId = null
            }
        }
    }

    fun answer() {
        scope.launch {
            val invite = activeInvite ?: return@launch
            try {
                val remoteSdp = invite.body
                if (remoteSdp.isBlank()) error("SDP الوارد فارغ")
                webrtc.createPeer()
                webrtc.setRemoteDescription(
                    SessionDescription(SessionDescription.Type.OFFER, remoteSdp),
                )
                val answer = webrtc.createAnswer()
                val callId = invite.header("Call-ID") ?: error("لا Call-ID")
                activeCallId = callId
                activeToTag = fromTag.ifBlank { newTag() }.also { fromTag = it }
                val body = answer.description
                val headers = linkedMapOf<String, String>()
                // انسخ كل Via كما وصلت
                invite.headers("Via").forEachIndexed { i, v ->
                    headers[if (i == 0) "Via" else "Via.$i"] = v
                }
                if (!headers.containsKey("Via")) {
                    headers["Via"] = invite.header("Via") ?: ""
                }
                headers["From"] = invite.header("From") ?: ""
                headers["To"] = withLocalTag(invite.header("To"), fromTag)
                headers["Call-ID"] = callId
                headers["CSeq"] = invite.header("CSeq") ?: "1 INVITE"
                headers["Contact"] = contactUri()
                headers["Content-Type"] = "application/sdp"
                headers["Content-Length"] = body.toByteArray(Charsets.UTF_8).size.toString()
                sendRaw(SipMessage("SIP/2.0 200 OK", headers, body).toWire())
                onCall(CallState.Active, extractUser(invite.header("From")))
            } catch (e: Exception) {
                Log.e(TAG, "فشل القبول", e)
                onLog("فشل القبول: ${e.message}")
                try {
                    reject()
                } catch (_: Exception) {
                }
                onCall(CallState.Ended, e.message)
            }
        }
    }

    fun reject() {
        val invite = activeInvite ?: return
        replyToInvite(invite, "486 Busy Here")
        activeInvite = null
        activeCallId = null
        webrtc.closePeer()
        onCall(CallState.Ended, null)
    }

    fun hangup() {
        scope.launch {
            val callId = activeCallId
            val invite = activeInvite
            if (callId != null && extension.isNotEmpty()) {
                try {
                    val branch = "z9hG4bK${UUID.randomUUID().toString().take(8)}"
                    val seq = cseq.getAndIncrement()
                    val peerUser = extractUser(invite?.header("From") ?: invite?.header("To"))
                    val requestUri = "sip:$peerUser@$sipDomain"
                    val headers = linkedMapOf(
                        "Via" to "SIP/2.0/WS $sipDomain;branch=$branch",
                        "From" to "<sip:$extension@$sipDomain>;tag=$fromTag",
                        "To" to "<sip:$peerUser@$sipDomain>${activeToTag?.let { ";tag=$it" } ?: ""}",
                        "Call-ID" to callId,
                        "CSeq" to "$seq BYE",
                        "Max-Forwards" to "70",
                        "Content-Length" to "0",
                    )
                    sendRaw(SipMessage("BYE $requestUri SIP/2.0", headers).toWire())
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
        try {
            if (socket != null && extension.isNotEmpty()) {
                // إلغاء تسجيل متزامن قدر الإمكان قبل إغلاق السوكيت
                scope.launch {
                    try {
                        sendRegister(authHeader = null, expires = 0)
                    } catch (_: Exception) {
                    }
                }
            }
        } catch (_: Exception) {
        }
        disconnectSocket(clearExtension = true)
        webrtc.dispose()
        scope.cancel()
        try {
            client.dispatcher.executorService.shutdown()
        } catch (_: Exception) {
        }
    }

    /** إبقاء الاتصال دون إلغاء التسجيل — عند مغادرة الواجهة فقط */
    fun detachUi() {
        // لا شيء: السوكيت يبقى عبر الخدمة
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
                if (code in 180..189) onCall(CallState.Ringing, destination)
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
                val contact = resp.header("Contact")
                val ackUri = contact?.let {
                    Regex("""<(sip:[^>]+)>""").find(it)?.groupValues?.getOrNull(1)
                } ?: "sip:$destination@$sipDomain"
                sendRaw(SipMessage("ACK $ackUri SIP/2.0", ack).toWire())
                onCall(CallState.Active, destination)
            }
            else -> {
                onCall(CallState.Ended, resp.startLine)
                webrtc.closePeer()
                activeCallId = null
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
            "User-Agent" to "MatchCall/1.1",
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
        val callId = msg.header("Call-ID") ?: msg.header("Call-Id")

        if (!msg.isRequest && callId != null) {
            val waiter = waiters[callId] ?: return
            val code = msg.statusCode ?: return
            // لا تُزل المنتظر على الردود المؤقتة (100/180) وإلا يضيع 200 OK
            if (code < 200) {
                waiter.invoke(msg)
                return
            }
            waiters.remove(callId)
            waiter.invoke(msg)
            return
        }

        when (msg.method) {
            "INVITE" -> {
                // إعادة INVITE / تحديث — تجاهل إن كانت مكالمة نشطة بنفس Call-ID
                activeInvite = msg
                activeCallId = callId
                val from = extractUser(msg.header("From"))
                val localTag = newTag()
                fromTag = localTag
                replyToInvite(msg, "100 Trying", addToTag = false)
                replyToInvite(msg, "180 Ringing", addToTag = true, localTag = localTag)
                onIncoming(from)
                onCall(CallState.Incoming, from)
            }
            "BYE" -> {
                replySimple(msg, "200 OK")
                activeCallId = null
                activeInvite = null
                webrtc.closePeer()
                onCall(CallState.Ended, null)
            }
            "ACK" -> { /* ignore */ }
            "OPTIONS", "NOTIFY", "INFO" -> replySimple(msg, "200 OK")
            "CANCEL" -> {
                replySimple(msg, "200 OK")
                if (activeInvite != null) {
                    replyToInvite(activeInvite!!, "487 Request Terminated")
                }
                activeInvite = null
                activeCallId = null
                webrtc.closePeer()
                onCall(CallState.Ended, null)
            }
        }
    }

    private fun replyToInvite(
        req: SipMessage,
        status: String,
        addToTag: Boolean = false,
        localTag: String = fromTag,
    ) {
        val headers = linkedMapOf<String, String>()
        req.headers("Via").forEachIndexed { i, v ->
            headers[if (i == 0) "Via" else "Via.$i"] = v
        }
        if (!headers.containsKey("Via")) headers["Via"] = req.header("Via") ?: ""
        headers["From"] = req.header("From") ?: ""
        val to = req.header("To") ?: ""
        headers["To"] = if (addToTag) withLocalTag(to, localTag) else to
        headers["Call-ID"] = req.header("Call-ID") ?: ""
        headers["CSeq"] = req.header("CSeq") ?: ""
        headers["Content-Length"] = "0"
        sendRaw(SipMessage("SIP/2.0 $status", headers).toWire())
    }

    private fun replySimple(req: SipMessage, status: String) {
        val headers = linkedMapOf<String, String>()
        req.headers("Via").forEachIndexed { i, v ->
            headers[if (i == 0) "Via" else "Via.$i"] = v
        }
        if (!headers.containsKey("Via")) headers["Via"] = req.header("Via") ?: ""
        headers["From"] = req.header("From") ?: ""
        headers["To"] = req.header("To") ?: ""
        headers["Call-ID"] = req.header("Call-ID") ?: ""
        headers["CSeq"] = req.header("CSeq") ?: ""
        headers["Content-Length"] = "0"
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
            "User-Agent" to "MatchCall/1.1",
            "Content-Length" to sdp.toByteArray(Charsets.UTF_8).size.toString(),
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
                    if (cont.isActive) cont.resume(response)
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

    private fun disconnectSocket(clearExtension: Boolean) {
        try {
            socket?.close(1000, "bye")
        } catch (_: Exception) {
        }
        socket = null
        waiters.clear()
        if (clearExtension) extension = ""
    }

    private fun withLocalTag(toHeader: String?, tag: String): String {
        val to = toHeader ?: return ";tag=$tag"
        return if (to.contains("tag=", ignoreCase = true)) {
            to.replace(Regex("""tag=[^;>\s]+"""), "tag=$tag")
        } else {
            "$to;tag=$tag"
        }
    }

    private fun newCallId() = "${UUID.randomUUID()}@$sipDomain"
    private fun newTag() = UUID.randomUUID().toString().replace("-", "").take(10)

    private fun extractTag(toHeader: String?): String? {
        if (toHeader == null) return null
        return Regex("""tag=([^;>\s]+)""").find(toHeader)?.groupValues?.getOrNull(1)
    }

    private fun extractUser(fromHeader: String?): String {
        if (fromHeader.isNullOrBlank()) return "?"
        return Regex("""sip:([^@>;]+)""").find(fromHeader)?.groupValues?.getOrNull(1)
            ?: fromHeader
    }

    private fun splitSipMessages(text: String): List<String> {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return emptyList()
        // رسائل مفصولة بسطر فارغ مزدوج عند لصقها
        val parts = trimmed.split(Regex("""\r?\n\r?\n(?=(?:SIP/2\.0|[A-Z]+ sip:))"""))
        return if (parts.size <= 1) listOf(trimmed) else parts.map { it.trim() }.filter { it.isNotEmpty() }
    }

    companion object {
        private const val TAG = "Softphone"
    }
}
