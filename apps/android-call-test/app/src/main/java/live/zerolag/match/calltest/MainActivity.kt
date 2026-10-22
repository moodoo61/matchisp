package live.zerolag.match.calltest

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
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
    private var softphone: Softphone? = null
    private var muted = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefs = Prefs(this)

        binding.inputExtension.setText(prefs.extension)
        binding.inputPassword.setText(prefs.password)

        if (prefs.lastWsUrl.isNotBlank()) {
            servers.add(
                DiscoveredServer(
                    name = prefs.lastServerName.ifBlank { "آخر خادم" },
                    host = prefs.lastSipDomain,
                    wsUrl = prefs.lastWsUrl,
                    sipDomain = prefs.lastSipDomain,
                    apiBase = "",
                    fromPort = 0,
                ),
            )
            refreshSpinner()
        }

        binding.btnDiscover.setOnClickListener { discover() }
        binding.btnRegister.setOnClickListener { register() }
        binding.btnUnregister.setOnClickListener {
            softphone?.unregister()
            softphone = null
        }
        binding.btnDial.setOnClickListener {
            ensureMic {
                softphone?.dial(binding.inputDestination.text?.toString()?.trim().orEmpty())
            }
        }
        binding.btnHangup.setOnClickListener { softphone?.hangup() }
        binding.btnAnswer.setOnClickListener {
            ensureMic { softphone?.answer() }
        }
        binding.btnReject.setOnClickListener { softphone?.reject() }
        binding.btnMute.setOnClickListener {
            muted = !muted
            softphone?.setMuted(muted)
            binding.btnMute.setText(if (muted) R.string.unmute else R.string.mute)
        }
    }

    private fun discover() {
        setStatus("جارٍ البحث على المنافذ 18760–18769…")
        binding.btnDiscover.isEnabled = false
        lifecycleScope.launch {
            try {
                val found = discovery.discover()
                servers.clear()
                servers.addAll(found)
                refreshSpinner()
                setStatus(
                    if (found.isEmpty()) "لم يُعثر على خادم — فعّل الإعلان من تبويب ضبط"
                    else "عُثر على ${found.size} خادم",
                )
                appendLog("اكتشاف: ${found.joinToString { it.host }}")
            } catch (e: Exception) {
                setStatus("فشل الاكتشاف: ${e.message}")
            } finally {
                binding.btnDiscover.isEnabled = true
            }
        }
    }

    private fun register() {
        val server = selectedServer()
        if (server == null) {
            toast("اختر خادماً بعد الاكتشاف")
            return
        }
        val ext = binding.inputExtension.text?.toString()?.trim().orEmpty()
        val pass = binding.inputPassword.text?.toString().orEmpty()
        if (ext.isEmpty() || pass.isEmpty()) {
            toast("أدخل الرقم وكلمة المرور")
            return
        }
        prefs.extension = ext
        prefs.password = pass
        prefs.lastWsUrl = server.wsUrl
        prefs.lastSipDomain = server.sipDomain
        prefs.lastServerName = server.name

        softphone?.dispose()
        softphone = Softphone(
            context = this,
            wsUrl = server.wsUrl,
            sipDomain = server.sipDomain,
            onLog = { runOnUiThread { appendLog(it) } },
            onReg = { state, detail ->
                runOnUiThread {
                    setStatus(
                        when (state) {
                            RegState.Connecting -> "جارٍ التسجيل…"
                            RegState.Registered -> "مسجّل: $ext @ ${server.host}"
                            RegState.Failed -> "فشل التسجيل: ${detail ?: ""}"
                            RegState.Idle -> "غير مسجّل"
                        },
                    )
                }
            },
            onCall = { state, detail ->
                runOnUiThread {
                    setStatus(
                        when (state) {
                            CallState.Idle -> "جاهز"
                            CallState.Dialing -> "طلب $detail…"
                            CallState.Ringing -> "رنين: $detail"
                            CallState.Active -> "مكالمة نشطة: $detail"
                            CallState.Ended -> "انتهت المكالمة"
                        },
                    )
                }
            },
            onIncoming = { from ->
                runOnUiThread {
                    toast("وارد من $from")
                    setStatus("مكالمة واردة من $from")
                }
            },
        )
        ensureMic { softphone?.register(ext, pass) }
    }

    private fun selectedServer(): DiscoveredServer? {
        val idx = binding.serverSpinner.selectedItemPosition
        return servers.getOrNull(idx)
    }

    private fun refreshSpinner() {
        val labels = servers.map { it.toString() }
        binding.serverSpinner.adapter =
            ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, labels)
    }

    private fun ensureMic(then: () -> Unit) {
        val ok = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
        if (ok) {
            then()
            return
        }
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.RECORD_AUDIO),
            REQ_MIC,
        )
        pendingAfterMic = then
    }

    private var pendingAfterMic: (() -> Unit)? = null

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
        }
        pendingAfterMic = null
    }

    private fun setStatus(text: String) {
        binding.statusText.text = text
    }

    private fun appendLog(line: String) {
        val prev = binding.logText.text?.toString().orEmpty()
        val next = (line + "\n" + prev).lineSequence().take(40).joinToString("\n")
        binding.logText.text = next
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        softphone?.dispose()
        softphone = null
        super.onDestroy()
    }

    companion object {
        private const val REQ_MIC = 1001
    }
}
