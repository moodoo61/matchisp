package live.zerolag.match.calltest.webrtc

import android.content.Context
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
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class WebRtcSession(context: Context) {
    private val appContext = context.applicationContext
    private var peer: PeerConnection? = null
    private var audioSource: AudioSource? = null
    private var audioTrack: AudioTrack? = null
    private var muted = false

    fun createPeer(
        onIce: (IceCandidate) -> Unit = {},
        onConnectionChange: (PeerConnection.PeerConnectionState) -> Unit = {},
    ): PeerConnection {
        closePeer()
        ensureFactory(appContext)
        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
        )
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
            rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED
        }
        val observer = object : PeerConnection.Observer {
            override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {}
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidate(candidate: IceCandidate?) {
                if (candidate != null) onIce(candidate)
            }
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onAddStream(stream: MediaStream?) {}
            override fun onRemoveStream(stream: MediaStream?) {}
            override fun onDataChannel(dc: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState?) {
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
        val sdp = awaitSdp { pc.createOffer(it, constraints) }
        awaitSet { pc.setLocalDescription(it, sdp) }
        return waitForIceComplete(pc)
    }

    suspend fun createAnswer(): SessionDescription {
        val pc = peer ?: error("لا يوجد PeerConnection")
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
        }
        val sdp = awaitSdp { pc.createAnswer(it, constraints) }
        awaitSet { pc.setLocalDescription(it, sdp) }
        return waitForIceComplete(pc)
    }

    suspend fun setRemoteDescription(sdp: SessionDescription) {
        val pc = peer ?: error("لا يوجد PeerConnection")
        awaitSet { pc.setRemoteDescription(it, sdp) }
    }

    fun setMuted(mute: Boolean) {
        muted = mute
        audioTrack?.setEnabled(!mute)
    }

    fun isMuted(): Boolean = muted

    fun closePeer() {
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
    }

    fun dispose() {
        closePeer()
        // لا نُغلق المصنع العام — يُعاد استخدامه طوال عمر العملية
    }

    private suspend fun waitForIceComplete(pc: PeerConnection): SessionDescription {
        var attempts = 0
        while (
            pc.iceGatheringState() != PeerConnection.IceGatheringState.COMPLETE &&
            attempts < 25
        ) {
            kotlinx.coroutines.delay(100)
            attempts++
        }
        return pc.localDescription
            ?: error("لا يوجد وصف محلي بعد ICE")
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
                factory = PeerConnectionFactory.builder()
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
    }
}
