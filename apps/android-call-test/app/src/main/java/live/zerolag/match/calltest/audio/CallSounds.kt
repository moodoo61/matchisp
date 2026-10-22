package live.zerolag.match.calltest.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.net.Uri

class CallSounds(context: Context) {
    private val appContext = context.applicationContext
    private var tone: ToneGenerator? = null
    private var ringtone: Ringtone? = null
    private var ringback: Ringtone? = null

    private fun ensureTone() {
        if (tone == null) {
            try {
                tone = ToneGenerator(AudioManager.STREAM_DTMF, 80)
            } catch (_: Exception) {
                tone = null
            }
        }
    }

    fun playKey(digit: Char) {
        ensureTone()
        val type = when (digit) {
            '0' -> ToneGenerator.TONE_DTMF_0
            '1' -> ToneGenerator.TONE_DTMF_1
            '2' -> ToneGenerator.TONE_DTMF_2
            '3' -> ToneGenerator.TONE_DTMF_3
            '4' -> ToneGenerator.TONE_DTMF_4
            '5' -> ToneGenerator.TONE_DTMF_5
            '6' -> ToneGenerator.TONE_DTMF_6
            '7' -> ToneGenerator.TONE_DTMF_7
            '8' -> ToneGenerator.TONE_DTMF_8
            '9' -> ToneGenerator.TONE_DTMF_9
            '*' -> ToneGenerator.TONE_DTMF_S
            '#' -> ToneGenerator.TONE_DTMF_P
            else -> return
        }
        try {
            tone?.startTone(type, 120)
        } catch (_: Exception) {
        }
    }

    fun startIncomingRing() {
        stopIncomingRing()
        try {
            val uri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                ?: return
            ringtone = RingtoneManager.getRingtone(appContext, uri)?.also {
                if (android.os.Build.VERSION.SDK_INT >= 28) {
                    it.isLooping = true
                }
                it.audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                it.play()
            }
        } catch (_: Exception) {
        }
    }

    fun stopIncomingRing() {
        try {
            ringtone?.stop()
        } catch (_: Exception) {
        }
        ringtone = null
    }

    fun startRingback() {
        stopRingback()
        try {
            // نغمة رنين صادر تقريبية عبر ToneGenerator
            ensureTone()
            tone?.startTone(ToneGenerator.TONE_SUP_RINGTONE, 3000)
        } catch (_: Exception) {
        }
        // كرر عبر runnable بسيط في الاستدعاءات المتتالية من الواجهة إن لزم
    }

    fun stopRingback() {
        try {
            tone?.stopTone()
        } catch (_: Exception) {
        }
        try {
            ringback?.stop()
        } catch (_: Exception) {
        }
        ringback = null
    }

    fun stopAll() {
        stopIncomingRing()
        stopRingback()
    }

    fun release() {
        stopAll()
        try {
            tone?.release()
        } catch (_: Exception) {
        }
        tone = null
    }
}
