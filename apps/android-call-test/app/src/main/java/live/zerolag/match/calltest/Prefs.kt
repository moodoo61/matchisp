package live.zerolag.match.calltest

import android.content.Context

class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("match_call_test", Context.MODE_PRIVATE)

    var extension: String
        get() = sp.getString("extension", "") ?: ""
        set(value) = sp.edit().putString("extension", value).apply()

    var password: String
        get() = sp.getString("password", "") ?: ""
        set(value) = sp.edit().putString("password", value).apply()

    var lastWsUrl: String
        get() = sp.getString("wsUrl", "") ?: ""
        set(value) = sp.edit().putString("wsUrl", value).apply()

    var lastSipDomain: String
        get() = sp.getString("sipDomain", "") ?: ""
        set(value) = sp.edit().putString("sipDomain", value).apply()

    var lastServerName: String
        get() = sp.getString("serverName", "") ?: ""
        set(value) = sp.edit().putString("serverName", value).apply()
}
