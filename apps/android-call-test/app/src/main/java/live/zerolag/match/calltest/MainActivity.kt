package live.zerolag.match.calltest

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import live.zerolag.match.calltest.databinding.ActivityMainBinding
import live.zerolag.match.calltest.discovery.DiscoveredServer
import live.zerolag.match.calltest.discovery.DiscoveryClient
import live.zerolag.match.calltest.sip.CallState
import live.zerolag.match.calltest.sip.RegState
import live.zerolag.match.calltest.sip.Softphone
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private val discovery = DiscoveryClient()
    private val servers = mutableListOf<DiscoveredServer>()
    private var selectedServer: DiscoveredServer? = null
    private var softphone: Softphone? = null
    private var muted = false
    private var dialBuffer = StringBuilder()
    private var pendingAfterMic: (() -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefs = Prefs(this)

        binding.inputServerHost.setText(prefs.lastHost.ifBlank { "172.18.1.2" })
        binding.inputExtension.setText(prefs.extension)
        binding.inputPassword.setText(prefs.password)

        setupServerScreen()
        setupLoginScreen()
        setupDialerScreen()

        when {
            prefs.lastWsUrl.isNotBlank() && prefs.extension.isNotBlank() && prefs.password.isNotBlank() -> {
                selectedServer = ServerConfig.fromHost(
                    prefs.lastHost.ifBlank { prefs.lastSipDomain },
                    prefs.lastServerName.ifBlank { "Match" },
                )?.copy(
                    wsUrl = prefs.lastWsUrl,
                    sipDomain = prefs.lastSipDomain.ifBlank { prefs.lastHost },
                )
                if (selectedServer != null) {
                    showScreen(Screen.Login)
                    // محاولة دخول تلقائي بالبيانات المحفوظة اختيارية — نترك المستخدم يضغط دخول
                    binding.loginServerLabel.text = selectedServer!!.host
                } else {
                    showScreen(Screen.Server)
                }
            }
            prefs.lastHost.isNotBlank() || prefs.lastWsUrl.isNotBlank() -> {
                selectedServer = ServerConfig.fromHost(prefs.lastHost.ifBlank { prefs.lastSipDomain })
                showScreen(if (selectedServer != null) Screen.Login else Screen.Server)
                binding.loginServerLabel.text = selectedServer?.host.orEmpty()
            }
            else -> showScreen(Screen.Server)
        }
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
            softphone?.dispose()
            softphone = null
            showScreen(Screen.Server)
        }
    }

    private fun setupDialerScreen() {
        val keys = listOf(
            binding.key1 to "1", binding.key2 to "2", binding.key3 to "3",
            binding.key4 to "4", binding.key5 to "5", binding.key6 to "6",
            binding.key7 to "7", binding.key8 to "8", binding.key9 to "9",
            binding.keyStar to "*", binding.key0 to "0", binding.keyHash to "#",
        )
        for ((btn, digit) in keys) {
            btn.setOnClickListener { appendDigit(digit) }
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
            ensureMic { softphone?.dial(dest) }
        }
        binding.btnHangup.setOnClickListener { softphone?.hangup() }
        binding.btnAnswer.setOnClickListener { ensureMic { softphone?.answer() } }
        binding.btnReject.setOnClickListener { softphone?.reject() }
        binding.btnMute.setOnClickListener {
            muted = !muted
            softphone?.setMuted(muted)
            binding.btnMute.text = getString(if (muted) R.string.unmute else R.string.mute)
        }
        binding.btnLogout.setOnClickListener {
            softphone?.unregister()
            softphone?.dispose()
            softphone = null
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

        softphone?.dispose()
        softphone = Softphone(
            context = this,
            wsUrl = server.wsUrl,
            sipDomain = server.sipDomain,
            onLog = {},
            onReg = { state, detail ->
                runOnUiThread {
                    when (state) {
                        RegState.Connecting -> binding.loginStatus.text = "جارٍ التسجيل…"
                        RegState.Registered -> {
                            binding.btnLogin.isEnabled = true
                            binding.dialerExtension.text = ext
                            binding.dialerRegDot.setTextColor(
                                ContextCompat.getColor(this, android.R.color.holo_green_light),
                            )
                            showScreen(Screen.Dialer)
                            updateCallUi(CallState.Idle, null)
                        }
                        RegState.Failed -> {
                            binding.btnLogin.isEnabled = true
                            binding.loginStatus.text = "فشل الدخول: ${detail ?: ""}"
                        }
                        RegState.Idle -> {
                            binding.btnLogin.isEnabled = true
                            binding.loginStatus.text = "غير متصل"
                        }
                    }
                }
            },
            onCall = { state, detail ->
                runOnUiThread { updateCallUi(state, detail) }
            },
            onIncoming = { from ->
                runOnUiThread {
                    dialBuffer.clear()
                    dialBuffer.append(from)
                    refreshDialDisplay()
                    binding.dialerStatus.text = "مكالمة واردة من $from"
                    binding.rowIdleActions.visibility = View.GONE
                    binding.rowInCallActions.visibility = View.GONE
                    binding.rowIncomingActions.visibility = View.VISIBLE
                }
            },
        )
        ensureMic {
            softphone?.register(ext, pass)
        }
    }

    private fun updateCallUi(state: CallState, detail: String?) {
        when (state) {
            CallState.Idle, CallState.Ended -> {
                binding.dialerStatus.text = if (state == CallState.Ended) "انتهت المكالمة" else "جاهز للاتصال"
                binding.rowIdleActions.visibility = View.VISIBLE
                binding.rowInCallActions.visibility = View.GONE
                binding.rowIncomingActions.visibility = View.GONE
                binding.dialPad.visibility = View.VISIBLE
                if (state == CallState.Ended) {
                    // أبقِ الرقم للطلب مجدداً
                }
            }
            CallState.Dialing -> {
                binding.dialerStatus.text = "جارٍ الطلب…"
                binding.rowIdleActions.visibility = View.GONE
                binding.rowInCallActions.visibility = View.VISIBLE
                binding.rowIncomingActions.visibility = View.GONE
            }
            CallState.Ringing -> {
                if (binding.rowIncomingActions.visibility == View.VISIBLE) {
                    binding.dialerStatus.text = "وارد من ${detail ?: ""}"
                } else {
                    binding.dialerStatus.text = "يرن… ${detail ?: ""}"
                    binding.rowIdleActions.visibility = View.GONE
                    binding.rowInCallActions.visibility = View.VISIBLE
                    binding.rowIncomingActions.visibility = View.GONE
                }
            }
            CallState.Active -> {
                binding.dialerStatus.text = "مكالمة جارية${detail?.let { " — $it" } ?: ""}"
                binding.rowIdleActions.visibility = View.GONE
                binding.rowInCallActions.visibility = View.VISIBLE
                binding.rowIncomingActions.visibility = View.GONE
                binding.dialPad.visibility = View.VISIBLE
            }
        }
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
        binding.screenServer.visibility = if (screen == Screen.Server) View.VISIBLE else View.GONE
        binding.screenLogin.visibility = if (screen == Screen.Login) View.VISIBLE else View.GONE
        binding.screenDialer.visibility = if (screen == Screen.Dialer) View.VISIBLE else View.GONE
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

    private fun ensureMic(then: () -> Unit) {
        val ok = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
        if (ok) {
            then()
            return
        }
        pendingAfterMic = then
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), REQ_MIC)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_MIC &&
            grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        ) {
            pendingAfterMic?.invoke()
        } else if (requestCode == REQ_MIC) {
            toast("إذن الميكروفون مطلوب")
            binding.btnLogin.isEnabled = true
            binding.loginStatus.text = "يلزم إذن الميكروفون"
        }
        pendingAfterMic = null
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        softphone?.dispose()
        softphone = null
        super.onDestroy()
    }

    private enum class Screen { Server, Login, Dialer }

    companion object {
        private const val REQ_MIC = 1001
    }
}

/** مستمع بسيط لاختيار العنصر بدون الحاجة لكل دوال AdapterView */
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
