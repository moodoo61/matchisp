package live.zerolag.match.calltest

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * صلاحيات تشغيل المكالمات: ميكروفون، إشعارات، بلوتوث (صوت)، وتجاهل تحسين البطارية.
 */
object AppPermissions {
    data class Item(
        val id: String,
        val title: String,
        val detail: String,
        val granted: Boolean,
        val runtime: Boolean,
    )

    fun status(context: Context): List<Item> {
        val items = mutableListOf<Item>()
        items += Item(
            id = Manifest.permission.RECORD_AUDIO,
            title = "الميكروفون",
            detail = "مطلوب لإرسال صوتك في المكالمة",
            granted = isGranted(context, Manifest.permission.RECORD_AUDIO),
            runtime = true,
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            items += Item(
                id = Manifest.permission.POST_NOTIFICATIONS,
                title = "الإشعارات",
                detail = "لإبقاء الاتصال بالخادم وإظهار المكالمات الواردة",
                granted = isGranted(context, Manifest.permission.POST_NOTIFICATIONS),
                runtime = true,
            )
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            items += Item(
                id = Manifest.permission.BLUETOOTH_CONNECT,
                title = "البلوتوث",
                detail = "لاستخدام سماعة بلوتوث أثناء المكالمة",
                granted = isGranted(context, Manifest.permission.BLUETOOTH_CONNECT),
                runtime = true,
            )
        }
        items += Item(
            id = "modify_audio",
            title = "التحكم بالصوت",
            detail = "مكبّر الصوت ووضع الاتصال — يُمنح تلقائياً مع التطبيق",
            granted = true,
            runtime = false,
        )
        items += Item(
            id = "battery",
            title = "العمل في الخلفية",
            detail = "عدم إيقاف التسجيل عند إغلاق الشاشة",
            granted = isIgnoringBatteryOptimizations(context),
            runtime = false,
        )
        return items
    }

    fun missingRuntime(context: Context): Array<String> =
        status(context)
            .filter { it.runtime && !it.granted }
            .map { it.id }
            .toTypedArray()

    fun allCriticalGranted(context: Context): Boolean =
        isGranted(context, Manifest.permission.RECORD_AUDIO) &&
            (
                Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                    isGranted(context, Manifest.permission.POST_NOTIFICATIONS)
                )

    fun requestRuntime(activity: Activity, requestCode: Int) {
        val missing = missingRuntime(activity)
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(activity, missing, requestCode)
        }
    }

    fun openBatterySettings(activity: Activity) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${activity.packageName}")
            }
            activity.startActivity(intent)
        } catch (_: Exception) {
            try {
                activity.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
            } catch (_: Exception) {
            }
        }
    }

    fun openAppSettings(activity: Activity) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", activity.packageName, null)
        }
        activity.startActivity(intent)
    }

    private fun isGranted(context: Context, permission: String): Boolean =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

    private fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true
        val pm = context.getSystemService(PowerManager::class.java) ?: return true
        return pm.isIgnoringBatteryOptimizations(context.packageName)
    }
}
