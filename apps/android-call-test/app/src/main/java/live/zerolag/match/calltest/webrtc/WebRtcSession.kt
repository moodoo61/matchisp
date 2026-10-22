package live.zerolag.match.calltest.webrtc

import android.content.Context
import android.media.AudioManager
import android.util.Log
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.DataChannel
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.audio.JavaAudioDeviceModule
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class WebRtcSession(context: Context) {
    private val appContext = context.applicationContext
    private val audioManager =
        appContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var peer: PeerConnection? = null
    private var audioSource: AudioSource? = null
    private var audioTrack: AudioTrack? = null
    private var muted = false
    private var savedAudioMode = AudioManager.MODE_NORMAL
    private var savedSpeaker = false

    fun createPeer(
        onIce: (IceCandidate) -> Unit = {},
        onConnectionChange: (PeerConnection.PeerConnectionState) -> Unit = {},
    ): PeerConnection {
        closePeer(keepAudioMode = true)
        ensureFactory(appContext)
        enterCallAudio()
        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
        )
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            // انتظر اكتمال الجمع قبل إرسال SDP — Asterisk لا يدعم trickle بشكل موثوق
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_ONCE
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
            rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED
            iceTransportsType = PeerConnection.IceTransportsType.ALL
        }
        val observer = object : PeerConnection.Observer {
            override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                Log.i(TAG, "ICE connection: $state")
            }
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {
                Log.i(TAG, "ICE gathering: $state")
            }
            override fun onIceCandidate(candidate: IceCandidate?) {
                if (candidate != null) {
                    Log.i(TAG, "ICE candidate: ${candidate.sdp}")
                    onIce(candidate)
                }
            }
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onAddStream(stream: MediaStream?) {}
            override fun onRemoveStream(stream: MediaStream?) {}
            override fun onDataChannel(dc: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState?) {
                Log.i(TAG, "PC state: $newState")
                if (newState != null) onConnectionChange(newState)
            }
        }
        val pc = factory!!.createPeerConnection(rtcConfig, observer)
            ?: error("تعذر إنشاء PeerConnection")
        peer = pc

        audioSource = factory!!.createAudioSource(MediaConstraints())
        audioTrack = factory!!.createAudioTrack("AUDIO0", audioSource)
        audioTrack?.setEnabled(true)
        pc.addTrack(audioTrack, listOf("stream0"))
        return pc
    }

    suspend fun createOffer(): SessionDescription {
        val pc = peer ?: error("لا يوجد PeerConnection")
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
        }
        val raw = awaitSdp { pc.createOffer(it, constraints) }
        val munged = SessionDescription(raw.type, preferTelephonyCodecs(raw.description))
        awaitSet { pc.setLocalDescription(it, munged) }
        return waitForIceComplete(pc)
    }

    suspend fun createAnswer(): SessionDescription {
        val pc = peer ?: error("لا يوجد PeerConnection")
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
        }
        val raw = awaitSdp { pc.createAnswer(it, constraints) }
        val munged = SessionDescription(raw.type, preferTelephonyCodecs(raw.description))
        awaitSet { pc.setLocalDescription(it, munged) }
        return waitForIceComplete(pc)
    }

    suspend fun setRemoteDescription(sdp: SessionDescription) {
        val pc = peer ?: error("لا يوجد PeerConnection")
        // لا نعدّل SDP البعيد — فقط تطبيع نهايات الأسطر
        val normalized = SessionDescription(sdp.type, normalizeSdp(sdp.description))
        awaitSet { pc.setRemoteDescription(it, normalized) }
    }

    fun setMuted(mute: Boolean) {
        muted = mute
        audioTrack?.setEnabled(!mute)
    }

    fun isMuted(): Boolean = muted

    fun closePeer(keepAudioMode: Boolean = false) {
        try {
            audioTrack?.dispose()
        } catch (_: Exception) {
        }
        audioTrack = null
        try {
            audioSource?.dispose()
        } catch (_: Exception) {
        }
        audioSource = null
        try {
            peer?.close()
            peer?.dispose()
        } catch (_: Exception) {
        }
        peer = null
        if (!keepAudioMode) leaveCallAudio()
    }

    fun dispose() {
        closePeer()
    }

    private fun enterCallAudio() {
        try {
            savedAudioMode = audioManager.mode
            savedSpeaker = audioManager.isSpeakerphoneOn
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager.isSpeakerphoneOn = true
        } catch (e: Exception) {
            Log.w(TAG, "تعذر ضبط وضع الصوت", e)
        }
    }

    private fun leaveCallAudio() {
        try {
            audioManager.isSpeakerphoneOn = savedSpeaker
            audioManager.mode = savedAudioMode
        } catch (_: Exception) {
        }
    }

    private suspend fun waitForIceComplete(pc: PeerConnection): SessionDescription {
        var attempts = 0
        val maxAttempts = 60 // حتى 6 ثوانٍ
        while (attempts < maxAttempts) {
            val state = pc.iceGatheringState()
            val desc = pc.localDescription?.description.orEmpty()
            val hasSrflxOrRelay =
                desc.contains(" typ srflx") || desc.contains(" typ relay")
            val hasUsableHost = hasUsableHostCandidate(desc)
            if (state == PeerConnection.IceGatheringState.COMPLETE) {
                break
            }
            // لا نخرج مبكراً بمرشّح VPN فقط (172.x من tun) — ننتظر srflx أو host صالح
            if (attempts >= 20 && (hasSrflxOrRelay || hasUsableHost)) {
                break
            }
            kotlinx.coroutines.delay(100)
            attempts++
        }
        val local = pc.localDescription ?: error("لا يوجد وصف محلي بعد ICE")
        val cleaned = stripBadCandidates(local.description)
        Log.i(TAG, "SDP جاهز (محاولات=$attempts):\n${cleaned.take(500)}")
        return SessionDescription(local.type, normalizeSdp(cleaned))
    }

    private suspend fun awaitSdp(block: (SdpObserver) -> Unit): SessionDescription =
        suspendCoroutine { cont ->
            block(object : SdpObserver {
                override fun onCreateSuccess(sdp: SessionDescription?) {
                    if (sdp != null) cont.resume(sdp)
                    else cont.resumeWithException(IllegalStateException("SDP فارغ"))
                }
                override fun onSetSuccess() {}
                override fun onCreateFailure(error: String?) {
                    cont.resumeWithException(IllegalStateException(error ?: "فشل إنشاء SDP"))
                }
                override fun onSetFailure(error: String?) {}
            })
        }

    private suspend fun awaitSet(block: (SdpObserver) -> Unit): Unit =
        suspendCoroutine { cont ->
            block(object : SdpObserver {
                override fun onCreateSuccess(sdp: SessionDescription?) {}
                override fun onSetSuccess() { cont.resume(Unit) }
                override fun onCreateFailure(error: String?) {}
                override fun onSetFailure(error: String?) {
                    cont.resumeWithException(IllegalStateException(error ?: "فشل تعيين SDP"))
                }
            })
        }

    companion object {
        private const val TAG = "WebRtcSession"
        @Volatile private var initialized = false
        @Volatile private var factory: PeerConnectionFactory? = null
        private var eglBase: EglBase? = null
        private var audioDeviceModule: JavaAudioDeviceModule? = null

        @Synchronized
        fun ensureFactory(context: Context) {
            if (initialized && factory != null) return
            try {
                PeerConnectionFactory.initialize(
                    PeerConnectionFactory.InitializationOptions.builder(context.applicationContext)
                        .setEnableInternalTracer(false)
                        .createInitializationOptions(),
                )
                eglBase = EglBase.create()
                audioDeviceModule = JavaAudioDeviceModule.builder(context.applicationContext)
                    .setUseHardwareAcousticEchoCanceler(true)
                    .setUseHardwareNoiseSuppressor(true)
                    .createAudioDeviceModule()
                // تجاهل VPN/loopback — وإلا ICE يعلن 172.19.x عبر xray ويُسقط DTLS عند Asterisk
                val options = PeerConnectionFactory.Options().apply {
                    networkIgnoreMask =
                        PeerConnectionFactory.Options.ADAPTER_TYPE_VPN or
                            PeerConnectionFactory.Options.ADAPTER_TYPE_LOOPBACK
                }
                factory = PeerConnectionFactory.builder()
                    .setOptions(options)
                    .setAudioDeviceModule(audioDeviceModule)
                    .setVideoEncoderFactory(
                        DefaultVideoEncoderFactory(eglBase!!.eglBaseContext, true, true),
                    )
                    .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase!!.eglBaseContext))
                    .createPeerConnectionFactory()
                initialized = true
            } catch (e: Exception) {
                Log.e(TAG, "فشل تهيئة WebRTC", e)
                throw e
            }
        }

        fun preferTelephonyCodecs(sdp: String): String {
            val lines = sdp.replace("\r\n", "\n").replace("\r", "\n").split("\n").toMutableList()
            val audioIdx = lines.indexOfFirst { it.startsWith("m=audio ") }
            if (audioIdx < 0) return normalizeSdp(sdp)
            val parts = lines[audioIdx].split(" ").toMutableList()
            if (parts.size < 4) return normalizeSdp(sdp)
            val header = parts.subList(0, 3)
            val pts = parts.subList(3, parts.size).toMutableList()
            val preferred = listOf("0", "8")
            val ordered = preferred.filter { pts.contains(it) } + pts.filter { it !in preferred }
            lines[audioIdx] = (header + ordered).joinToString(" ")
            return normalizeSdp(lines.joinToString("\n"))
        }

        fun normalizeSdp(sdp: String): String {
            val body = sdp.replace("\r\n", "\n").replace("\r", "\n").trim() + "\n"
            return body.replace("\n", "\r\n")
        }

        /** host على Wi‑Fi/خلوي صالح — ليس tun/docker شائع */
        private fun hasUsableHostCandidate(sdp: String): Boolean {
            val hostLines = sdp.lineSequence().filter {
                it.startsWith("a=candidate:") && it.contains(" typ host")
            }
            for (line in hostLines) {
                val ip = extractCandidateIp(line) ?: continue
                if (isLikelyVpnOrLocalBridge(ip)) continue
                return true
            }
            return false
        }

        private fun stripBadCandidates(sdp: String): String {
            val lines = sdp.replace("\r\n", "\n").replace("\r", "\n").split("\n")
            val kept = lines.filter { line ->
                if (!line.startsWith("a=candidate:")) return@filter true
                val ip = extractCandidateIp(line) ?: return@filter true
                // احذف IPv6 فريدة محلية وواجهات tun الشائعة التي تكسر ICE مع Asterisk
                if (ip.startsWith("fd") || ip.startsWith("fe80:")) return@filter false
                if (isLikelyVpnOrLocalBridge(ip) && line.contains(" typ host")) return@filter false
                true
            }
            return kept.joinToString("\n")
        }

        private fun extractCandidateIp(line: String): String? {
            // a=candidate:... foundation comp proto prio IP port typ ...
            val parts = line.removePrefix("a=candidate:").split(" ")
            // foundation component protocol priority ip port
            return parts.getOrNull(4)
        }

        private fun isLikelyVpnOrLocalBridge(ip: String): Boolean {
            // أبقِ 172.18.x (شبكة Match المحلية) — احذف tun/docker الشائعة فقط
            if (ip.startsWith("172.17.") || ip.startsWith("172.19.")) return true
            if (ip.startsWith("10.8.") || ip.startsWith("10.9.")) return true
            if (ip.startsWith("127.")) return true
            return false
        }
    }
}
