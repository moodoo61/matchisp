package live.zerolag.match.calltest

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import live.zerolag.match.calltest.sip.CallState
import live.zerolag.match.calltest.sip.RegState

/**
 * يبقي تسجيل SIP حياً في الخلفية عند مغادرة واجهة التطبيق.
 */
class CallForegroundService : Service() {
    private var listener: CallSession.Listener? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannels()
        startForeground(NOTIF_ID, buildStatusNotification("متصل بالخادم"))
        val l = CallSession.Listener(
            onReg = { state, _ ->
                val text = when (state) {
                    RegState.Registered -> "مسجّل: ${CallSession.extension}"
                    RegState.Connecting -> "جارٍ التسجيل…"
                    RegState.Failed -> "فشل التسجيل"
                    RegState.Idle -> "غير متصل"
                }
                notifyStatus(text)
            },
            onCall = { state, detail ->
                when (state) {
                    CallState.Incoming -> showIncomingNotification(detail ?: "?")
                    CallState.Active -> notifyStatus("مكالمة جارية")
                    CallState.Dialing, CallState.Ringing ->
                        notifyStatus("اتصال… ${detail ?: ""}")
                    CallState.Idle, CallState.Ended ->
                        notifyStatus("مسجّل: ${CallSession.extension}")
                }
            },
            onIncoming = { from ->
                showIncomingNotification(from)
            },
        )
        listener = l
        CallSession.addListener(l)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        listener?.let { CallSession.removeListener(it) }
        listener = null
        super.onDestroy()
    }

    private fun ensureChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = getSystemService(NotificationManager::class.java)
        mgr.createNotificationChannel(
            NotificationChannel(
                CHANNEL_STATUS,
                "اتصال Match",
                NotificationManager.IMPORTANCE_LOW,
            ),
        )
        mgr.createNotificationChannel(
            NotificationChannel(
                CHANNEL_INCOMING,
                "مكالمات واردة",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "تنبيه عند ورود مكالمة"
                setSound(null, null)
            },
        )
    }

    private fun openAppIntent(incomingFrom: String? = null): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            if (!incomingFrom.isNullOrBlank()) {
                putExtra(EXTRA_INCOMING, incomingFrom)
            }
        }
        return PendingIntent.getActivity(
            this,
            if (incomingFrom != null) 2 else 1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun buildStatusNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_STATUS)
            .setContentTitle("Match Call")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(openAppIntent())
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun notifyStatus(text: String) {
        val mgr = getSystemService(NotificationManager::class.java)
        mgr.notify(NOTIF_ID, buildStatusNotification(text))
    }

    private fun showIncomingNotification(from: String) {
        val fullScreen = openAppIntent(from)
        val notif = NotificationCompat.Builder(this, CHANNEL_INCOMING)
            .setContentTitle("مكالمة واردة")
            .setContentText("من $from")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(fullScreen)
            .setFullScreenIntent(fullScreen, true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()
        // استبدل إشعار الخدمة بإشعار الوارد (نفس id للـ foreground)
        startForeground(NOTIF_ID, notif)
        // حاول فتح الواجهة مباشرة إن أمكن
        try {
            startActivity(
                Intent(this, MainActivity::class.java).apply {
                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP or
                            Intent.FLAG_ACTIVITY_CLEAR_TOP,
                    )
                    putExtra(EXTRA_INCOMING, from)
                },
            )
        } catch (_: Exception) {
        }
    }

    companion object {
        const val CHANNEL_STATUS = "match_call_status"
        const val CHANNEL_INCOMING = "match_call_incoming"
        const val NOTIF_ID = 7101
        const val EXTRA_INCOMING = "incoming_from"

        fun start(context: Context) {
            val i = Intent(context, CallForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(i)
            } else {
                context.startService(i)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, CallForegroundService::class.java))
        }
    }
}
