package live.zerolag.match.calltest

import android.content.Context
import live.zerolag.match.calltest.sip.CallState
import live.zerolag.match.calltest.sip.RegState
import live.zerolag.match.calltest.sip.Softphone
import java.util.concurrent.CopyOnWriteArrayList

/**
 * جلسة اتصال مشتركة بين الواجهة وخدمة الخلفية — لا تُلغى عند مغادرة Activity.
 */
object CallSession {
    data class Listener(
        val onReg: (RegState, String?) -> Unit = { _, _ -> },
        val onCall: (CallState, String?) -> Unit = { _, _ -> },
        val onIncoming: (String) -> Unit = {},
        val onLog: (String) -> Unit = {},
    )

    @Volatile var softphone: Softphone? = null
        private set
    @Volatile var wsUrl: String = ""
        private set
    @Volatile var sipDomain: String = ""
        private set
    @Volatile var host: String = ""
        private set
    @Volatile var extension: String = ""
        private set
    @Volatile var lastReg: RegState = RegState.Idle
        private set
    @Volatile var lastCall: CallState = CallState.Idle
        private set
    @Volatile var lastCallDetail: String? = null
        private set
    @Volatile var incomingFrom: String? = null
        private set

    private val listeners = CopyOnWriteArrayList<Listener>()

    fun addListener(listener: Listener) {
        listeners.add(listener)
        // مزامنة الحالة الحالية
        listener.onReg(lastReg, null)
        listener.onCall(lastCall, lastCallDetail)
        incomingFrom?.let { listener.onIncoming(it) }
    }

    fun removeListener(listener: Listener) {
        listeners.remove(listener)
    }

    fun connect(
        context: Context,
        host: String,
        wsUrl: String,
        sipDomain: String,
        extension: String,
        password: String,
    ) {
        this.host = host
        this.wsUrl = wsUrl
        this.sipDomain = sipDomain
        this.extension = extension
        softphone?.dispose()
        softphone = Softphone(
            context = context.applicationContext,
            wsUrl = wsUrl,
            sipDomain = sipDomain,
            onLog = { msg -> listeners.forEach { it.onLog(msg) } },
            onReg = { state, detail ->
                lastReg = state
                listeners.forEach { it.onReg(state, detail) }
            },
            onCall = { state, detail ->
                lastCall = state
                lastCallDetail = detail
                when (state) {
                    CallState.Incoming -> { /* incomingFrom يُضبط في onIncoming */ }
                    CallState.Idle, CallState.Ended -> incomingFrom = null
                    CallState.Active, CallState.Dialing, CallState.Ringing -> {
                        if (state != CallState.Incoming) {
                            // بعد القبول لا نبقي شاشة الوارد
                            if (state == CallState.Active) incomingFrom = null
                        }
                    }
                }
                listeners.forEach { it.onCall(state, detail) }
            },
            onIncoming = { from ->
                incomingFrom = from
                lastCall = CallState.Incoming
                lastCallDetail = from
                listeners.forEach { it.onIncoming(from) }
            },
        )
        softphone?.register(extension, password)
    }

    fun logout() {
        softphone?.dispose()
        softphone = null
        extension = ""
        lastReg = RegState.Idle
        lastCall = CallState.Idle
        lastCallDetail = null
        incomingFrom = null
        listeners.forEach {
            it.onReg(RegState.Idle, null)
            it.onCall(CallState.Idle, null)
        }
    }
}
