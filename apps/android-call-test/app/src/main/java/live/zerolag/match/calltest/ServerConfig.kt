package live.zerolag.match.calltest

import live.zerolag.match.calltest.discovery.DiscoveredServer

object ServerConfig {
    fun fromHost(raw: String, name: String = "Match"): DiscoveredServer? {
        val host = normalizeHost(raw) ?: return null
        return DiscoveredServer(
            name = name,
            host = host,
            wsUrl = "ws://$host:8088/ws",
            sipDomain = host,
            apiBase = "http://$host:3001",
            fromPort = 0,
        )
    }

    fun normalizeHost(raw: String): String? {
        var h = raw.trim()
        if (h.isEmpty()) return null
        h = h.removePrefix("https://").removePrefix("http://").removePrefix("ws://").removePrefix("wss://")
        h = h.substringBefore('/').substringBefore(':').trim()
        return h.ifBlank { null }
    }
}
