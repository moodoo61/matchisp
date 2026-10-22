package live.zerolag.match.calltest

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import live.zerolag.match.calltest.audio.CallSounds
import live.zerolag.match.calltest.databinding.ActivityMainBinding
import live.zerolag.match.calltest.discovery.DiscoveredServer
import live.zerolag.match.calltest.discovery.DiscoveryClient
import live.zerolag.match.calltest.sip.CallState
import live.zerolag.match.calltest.sip.RegState
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private lateinit var sounds: CallSounds
    private val discovery = DiscoveryClient()
    private val servers = mutableListOf<DiscoveredServer>()
    private var selectedServer: DiscoveredServer? = null
    private var muted = false
    private var dialBuffer = StringBuilder()
    private var pendingAfterPerms: (() -> Unit)? = null
    private var sessionListener: CallSession.Listener? = null
    private var afterPermissionsScreen: Screen = Screen.Server
    private val ringbackHandler = Handler(Looper.getMainLooper())
    private var ringbackRunning = false
    private val ringbackTick = object : Runnable {
        override fun run() {
            if (!ringbackRunning) return
            sounds.startRingback()
            ringbackHandler.postDelayed(this, 4000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefs = Prefs(this)
        sounds = CallSounds(this)

        binding.inputServerHost.setText(prefs.lastHost.ifBlank { "172.18.1.2" })
        binding.inputExtension.setText(prefs.extension)
        binding.inputPassword.setText(prefs.password)

        setupPermissionsScreen()
        setupServerScreen()
        setupLoginScreen()
        setupDialerScreen()
        attachSessionListener()
        handleIncomingIntent(intent)

        afterPermissionsScreen = resolveStartScreen()
        if (!AppPermissions.allCriticalGranted(this)) {
            showScreen(Screen.Permissions)
            refreshPermissionsUi()
        } else {
            showScreen(afterPermissionsScreen)
        }
    }

    override fun onResume() {
        super.onResume()
        if (binding.screenPermissions.visibility == View.VISIBLE) {
            refreshPermissionsUi()
        }
    }

    private fun resolveStartScreen(): Screen {
        return when {
            CallSession.softphone != null && CallSession.lastReg == RegState.Registered -> {
                selectedServer = ServerConfig.fromHost(
                    CallSession.host.ifBlank { prefs.lastHost },
                    prefs.lastServerName.ifBlank { "Match" },
                )?.copy(
                    wsUrl = CallSession.wsUrl.ifBlank { prefs.lastWsUrl },
                    sipDomain = CallSession.sipDomain.ifBlank { prefs.lastSipDomain },
                )
                binding.dialerExtension.text = CallSession.extension
                updateCallUi(CallSession.lastCall, CallSession.lastCallDetail)
                CallSession.incomingFrom?.let { showIncoming(it) }
                Screen.Dialer
            }
            prefs.lastWsUrl.isNotBlank() && prefs.extension.isNotBlank() && prefs.password.isNotBlank() -> {
                selectedServer = ServerConfig.fromHost(
                    prefs.lastHost.ifBlank { prefs.lastSipDomain },
                    prefs.lastServerName.ifBlank { "Match" },
                )?.copy(
                    wsUrl = prefs.lastWsUrl,
                    sipDomain = prefs.lastSipDomain.ifBlank { prefs.lastHost },
                )
                if (selectedServer != null) {
                    binding.loginServerLabel.text = selectedServer!!.host
                    Screen.Login
                } else Screen.Server
            }
            prefs.lastHost.isNotBlank() || prefs.lastWsUrl.isNotBlank() -> {
                selectedServer = ServerConfig.fromHost(prefs.lastHost.ifBlank { prefs.lastSipDomain })
                binding.loginServerLabel.text = selectedServer?.host.orEmpty()
                if (selectedServer != null) Screen.Login else Screen.Server
            }
            else -> Screen.Server
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val from = intent?.getStringExtra(CallForegroundService.EXTRA_INCOMING) ?: return
        if (from.isBlank()) return
        showScreen(Screen.Dialer)
        showIncoming(from)
    }

    private fun setupPermissionsScreen() {
        binding.btnRequestPermissions.setOnClickListener {
            AppPermissions.requestRuntime(this, REQ_ALL_PERMS)
        }
        binding.btnBatteryPermission.setOnClickListener {
            AppPermissions.openBatterySettings(this)
        }
        binding.btnPermissionsContinue.setOnClickListener {
            if (!AppPermissions.allCriticalGranted(this)) {
                binding.permissionsStatus.text = "الميكروفون والإشعارات مطلوبان للمتابعة"
                toast("امنح الصلاحيات المطلوبة أولاً")
                return@setOnClickListener
            }
            showScreen(afterPermissionsScreen)
        }
    }

    private fun refreshPermissionsUi() {
        val list = binding.permissionsList
        list.removeAllViews()
        for (item in AppPermissions.status(this)) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, 12, 0, 12)
            }
            val title = TextView(this).apply {
                text = if (item.granted) "✓ ${item.title}" else "○ ${item.title}"
                setTextColor(if (item.granted) Color.parseColor("#22C55E") else Color.parseColor("#F8FAFC"))
                textSize = 16f
            }
            val detail = TextView(this).apply {
                text = item.detail
                setTextColor(Color.parseColor("#94A3B8"))
                textSize = 13f
            }
            row.addView(title)
            row.addView(detail)
            list.addView(row)
        }
        val ok = AppPermissions.allCriticalGranted(this)
        binding.btnPermissionsContinue.isEnabled = ok
        binding.permissionsStatus.text =
            if (ok) "جاهز — يمكنك المتابعة"
            else "اضغط «منح الصلاحيات» ثم فعّل العمل في الخلفية إن طُلب"
    }

    private fun attachSessionListener() {
        val listener = CallSession.Listener(
            onReg = { state, detail ->
                runOnUiThread {
                    when (state) {
                        RegState.Connecting -> binding.loginStatus.text = "جارٍ التسجيل…"
                        RegState.Registered -> {
                            binding.btnLogin.isEnabled = true
                            binding.dialerExtension.text = CallSession.extension
                            binding.dialerRegDot.setTextColor(Color.parseColor("#22C55E"))
                            showScreen(Screen.Dialer)
                            if (CallSession.lastCall == CallState.Idle) {
                                updateCallUi(CallState.Idle, null)
                            }
                        }
                        RegState.Failed -> {
                            binding.btnLogin.isEnabled = true
                            binding.loginStatus.text = "فشل الدخول: ${detail ?: ""}"
                            binding.dialerRegDot.setTextColor(Color.parseColor("#EF4444"))
                        }
                        RegState.Idle -> {
                            binding.btnLogin.isEnabled = true
                            if (binding.screenDialer.visibility != View.VISIBLE) {
                                binding.loginStatus.text = "غير متصل"
                            }
                            binding.dialerRegDot.setTextColor(Color.parseColor("#64748B"))
                        }
                    }
                }
            },
            onCall = { state, detail ->
                runOnUiThread { updateCallUi(state, detail) }
            },
            onIncoming = { from ->
                runOnUiThread { showIncoming(from) }
            },
        )
        sessionListener = listener
        CallSession.addListener(listener)
    }

    private fun setupServerScreen() {
        binding.btnContinueServer.setOnClickListener {
            val host = binding.inputServerHost.text?.toString().orEmpty()
            val server = ServerConfig.fromHost(host) ?: run {
                toast("أدخل عنوان خادم صالحاً")
                return@setOnClickListener
            }
            selectServer(server)
            showScreen(Screen.Login)
        }
        binding.btnDiscover.setOnClickListener { discover() }
        binding.serverSpinner.setOnItemSelectedListenerSoft { position ->
            servers.getOrNull(position)?.let { discovered ->
                binding.inputServerHost.setText(discovered.host)
            }
        }
    }

    private fun setupLoginScreen() {
        binding.btnLogin.setOnClickListener { login() }
        binding.btnChangeServer.setOnClickListener {
            CallForegroundService.stop(this)
            CallSession.logout()
            showScreen(Screen.Server)
        }
    }

    private fun setupDialerScreen() {
        val keys = listOf(
            binding.key1 to '1', binding.key2 to '2', binding.key3 to '3',
            binding.key4 to '4', binding.key5 to '5', binding.key6 to '6',
            binding.key7 to '7', binding.key8 to '8', binding.key9 to '9',
            binding.keyStar to '*', binding.key0 to '0', binding.keyHash to '#',
        )
        for ((btn, digit) in keys) {
            btn.setOnClickListener {
                sounds.playKey(digit)
                appendDigit(digit.toString())
            }
        }
        binding.btnBackspace.setOnClickListener {
            if (dialBuffer.isNotEmpty()) {
                dialBuffer.deleteCharAt(dialBuffer.length - 1)
                refreshDialDisplay()
            }
        }
        binding.btnBackspace.setOnLongClickListener {
            dialBuffer.clear()
            refreshDialDisplay()
            true
        }
        binding.btnCall.setOnClickListener {
            val dest = dialBuffer.toString().trim()
            if (dest.isEmpty()) {
                toast("أدخل رقماً للاتصال")
                return@setOnClickListener
            }
            ensureAllPerms { CallSession.softphone?.dial(dest) }
        }
        binding.btnHangup.setOnClickListener {
            stopCallSounds()
            CallSession.softphone?.hangup()
        }
        binding.btnAnswer.setOnClickListener {
            stopCallSounds()
            ensureAllPerms { CallSession.softphone?.answer() }
        }
        binding.btnReject.setOnClickListener {
            stopCallSounds()
            CallSession.softphone?.reject()
        }
        binding.btnMute.setOnClickListener {
            muted = !muted
            CallSession.softphone?.setMuted(muted)
            binding.btnMute.text = getString(if (muted) R.string.unmute else R.string.mute)
        }
        binding.btnLogout.setOnClickListener {
            stopCallSounds()
            CallForegroundService.stop(this)
            CallSession.logout()
            prefs.clearSession()
            dialBuffer.clear()
            refreshDialDisplay()
            showScreen(Screen.Login)
            binding.loginStatus.text = "تم تسجيل الخروج"
        }
    }

    private fun discover() {
        binding.serverStatus.text = "جارٍ البحث على المنافذ 18760–18769…"
        binding.btnDiscover.isEnabled = false
        lifecycleScope.launch {
            try {
                val found = discovery.discover()
                servers.clear()
                servers.addAll(found)
                binding.serverSpinner.adapter = ArrayAdapter(
                    this@MainActivity,
                    android.R.layout.simple_spinner_dropdown_item,
                    found.map { it.toString() },
                )
                binding.serverStatus.text =
                    if (found.isEmpty()) "لم يُعثر على خادم — أدخل العنوان يدوياً"
                    else "عُثر على ${found.size} — اختر من القائمة أو تابع"
                found.firstOrNull()?.let {
                    binding.inputServerHost.setText(it.host)
                }
            } catch (e: Exception) {
                binding.serverStatus.text = "فشل الاكتشاف: ${e.message}"
            } finally {
                binding.btnDiscover.isEnabled = true
            }
        }
    }

    private fun selectServer(server: DiscoveredServer) {
        selectedServer = server
        prefs.lastHost = server.host
        prefs.lastWsUrl = server.wsUrl
        prefs.lastSipDomain = server.sipDomain
        prefs.lastServerName = server.name
        binding.loginServerLabel.text = server.host
        binding.loginStatus.text = ""
    }

    private fun login() {
        val server = selectedServer ?: ServerConfig.fromHost(
            binding.inputServerHost.text?.toString().orEmpty(),
        )
        if (server == null) {
            toast("حدّد الخادم أولاً")
            showScreen(Screen.Server)
            return
        }
        selectedServer = server
        val ext = binding.inputExtension.text?.toString()?.trim().orEmpty()
        val pass = binding.inputPassword.text?.toString().orEmpty()
        if (ext.isEmpty() || pass.isEmpty()) {
            toast("أدخل الرقم وكلمة المرور")
            return
        }
        prefs.extension = ext
        prefs.password = pass
        prefs.lastHost = server.host
        prefs.lastWsUrl = server.wsUrl
        prefs.lastSipDomain = server.sipDomain

        binding.loginStatus.text = "جارٍ الاتصال…"
        binding.btnLogin.isEnabled = false

        ensureAllPerms {
            CallSession.connect(
                context = this,
                host = server.host,
                wsUrl = server.wsUrl,
                sipDomain = server.sipDomain,
                extension = ext,
                password = pass,
            )
            CallForegroundService.start(this)
        }
    }

    private fun showIncoming(from: String) {
        showScreen(Screen.Dialer)
        dialBuffer.clear()
        dialBuffer.append(from)
        refreshDialDisplay()
        binding.dialerStatus.text = "مكالمة واردة من $from"
        binding.rowIdleActions.visibility = View.GONE
        binding.rowInCallActions.visibility = View.GONE
        binding.rowIncomingActions.visibility = View.VISIBLE
        binding.dialPad.visibility = View.GONE
        sounds.startIncomingRing()
        stopRingbackLoop()
    }

    private fun updateCallUi(state: CallState, detail: String?) {
        when (state) {
            CallState.Idle, CallState.Ended -> {
                stopCallSounds()
                binding.dialerStatus.text =
                    if (state == CallState.Ended) "انتهت المكالمة" else "جاهز للاتصال"
                binding.rowIdleActions.visibility = View.VISIBLE
                binding.rowInCallActions.visibility = View.GONE
                binding.rowIncomingActions.visibility = View.GONE
                binding.dialPad.visibility = View.VISIBLE
            }
            CallState.Incoming -> {
                showIncoming(detail ?: CallSession.incomingFrom ?: "?")
            }
            CallState.Dialing -> {
                binding.dialerStatus.text = "جارٍ الطلب…"
                binding.rowIdleActions.visibility = View.GONE
                binding.rowInCallActions.visibility = View.VISIBLE
                binding.rowIncomingActions.visibility = View.GONE
                startRingbackLoop()
            }
            CallState.Ringing -> {
                binding.dialerStatus.text = "يرن… ${detail ?: ""}"
                binding.rowIdleActions.visibility = View.GONE
                binding.rowInCallActions.visibility = View.VISIBLE
                binding.rowIncomingActions.visibility = View.GONE
                startRingbackLoop()
            }
            CallState.Active -> {
                stopCallSounds()
                binding.dialerStatus.text = "مكالمة جارية${detail?.let { " — $it" } ?: ""}"
                binding.rowIdleActions.visibility = View.GONE
                binding.rowInCallActions.visibility = View.VISIBLE
                binding.rowIncomingActions.visibility = View.GONE
                binding.dialPad.visibility = View.VISIBLE
            }
        }
    }

    private fun startRingbackLoop() {
        if (ringbackRunning) return
        ringbackRunning = true
        sounds.startRingback()
        ringbackHandler.postDelayed(ringbackTick, 4000)
    }

    private fun stopRingbackLoop() {
        ringbackRunning = false
        ringbackHandler.removeCallbacks(ringbackTick)
        sounds.stopRingback()
    }

    private fun stopCallSounds() {
        stopRingbackLoop()
        sounds.stopIncomingRing()
    }

    private fun appendDigit(digit: String) {
        if (dialBuffer.length >= 24) return
        dialBuffer.append(digit)
        refreshDialDisplay()
    }

    private fun refreshDialDisplay() {
        binding.dialerDisplay.text = dialBuffer.toString()
    }

    private fun showScreen(screen: Screen) {
        binding.screenPermissions.visibility =
            if (screen == Screen.Permissions) View.VISIBLE else View.GONE
        binding.screenServer.visibility = if (screen == Screen.Server) View.VISIBLE else View.GONE
        binding.screenLogin.visibility = if (screen == Screen.Login) View.VISIBLE else View.GONE
        binding.screenDialer.visibility = if (screen == Screen.Dialer) View.VISIBLE else View.GONE
        if (screen == Screen.Permissions) refreshPermissionsUi()
        if (screen == Screen.Login) {
            binding.loginServerLabel.text = selectedServer?.host.orEmpty()
            binding.btnLogin.isEnabled = true
        }
        if (screen == Screen.Dialer) {
            muted = false
            binding.btnMute.setText(R.string.mute)
            refreshDialDisplay()
        }
    }

    private fun ensureAllPerms(then: () -> Unit) {
        if (AppPermissions.allCriticalGranted(this)) {
            then()
            return
        }
        pendingAfterPerms = then
        afterPermissionsScreen = when {
            binding.screenDialer.visibility == View.VISIBLE -> Screen.Dialer
            binding.screenLogin.visibility == View.VISIBLE -> Screen.Login
            else -> Screen.Server
        }
        showScreen(Screen.Permissions)
        AppPermissions.requestRuntime(this, REQ_ALL_PERMS)
        toast("يلزم منح الصلاحيات أولاً")
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_ALL_PERMS) return
        refreshPermissionsUi()
        if (AppPermissions.allCriticalGranted(this)) {
            val next = pendingAfterPerms
            pendingAfterPerms = null
            if (binding.screenPermissions.visibility == View.VISIBLE && next == null) {
                // يبقى المستخدم ليضغط متابعة
            } else {
                next?.invoke()
            }
        } else {
            pendingAfterPerms = null
            binding.btnLogin.isEnabled = true
            binding.loginStatus.text = "صلاحيات ناقصة — راجع شاشة الصلاحيات"
            val denied = grantResults.none { it == PackageManager.PERMISSION_GRANTED }
            if (denied) {
                toast("بعض الصلاحيات رُفضت — يمكن فتح إعدادات التطبيق")
                AppPermissions.openAppSettings(this)
            }
        }
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        sessionListener?.let { CallSession.removeListener(it) }
        sessionListener = null
        stopCallSounds()
        if (isFinishing) {
            sounds.release()
        }
        super.onDestroy()
    }

    private enum class Screen { Permissions, Server, Login, Dialer }

    companion object {
        private const val REQ_ALL_PERMS = 1100
    }
}

private fun android.widget.Spinner.setOnItemSelectedListenerSoft(onSelect: (Int) -> Unit) {
    onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
        override fun onItemSelected(
            parent: android.widget.AdapterView<*>?,
            view: View?,
            position: Int,
            id: Long,
        ) {
            onSelect(position)
        }

        override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
    }
}
