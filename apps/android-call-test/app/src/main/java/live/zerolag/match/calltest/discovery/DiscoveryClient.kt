package live.zerolag.match.calltest.discovery

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class DiscoveryClient(
    private val perPortTimeoutMs: Int = 700,
) {
    suspend fun discover(): List<DiscoveredServer> = withContext(Dispatchers.IO) {
        val found = LinkedHashMap<String, DiscoveredServer>()
        val probe = DiscoveryPorts.PROBE.toByteArray(StandardCharsets.UTF_8)
        val broadcast = InetAddress.getByName("255.255.255.255")

        for (port in DiscoveryPorts.ALL) {
            DatagramSocket().use { socket ->
                socket.broadcast = true
                socket.soTimeout = perPortTimeoutMs
                socket.bind(InetSocketAddress(0))
                val packet = DatagramPacket(probe, probe.size, broadcast, port)
                try {
                    socket.send(packet)
                } catch (_: Exception) {
                    return@use
                }
                val buf = ByteArray(4096)
                val deadline = System.currentTimeMillis() + perPortTimeoutMs
                while (System.currentTimeMillis() < deadline) {
                    try {
                        val incoming = DatagramPacket(buf, buf.size)
                        socket.receive(incoming)
                        val text = String(
                            incoming.data,
                            incoming.offset,
                            incoming.length,
                            StandardCharsets.UTF_8,
                        ).trim()
                        val server = parseBeacon(text, port) ?: continue
                        found.putIfAbsent("${server.host}|${server.wsUrl}", server)
                    } catch (_: Exception) {
                        break
                    }
                }
            }
        }
        found.values.toList()
    }

    private fun parseBeacon(text: String, fromPort: Int): DiscoveredServer? {
        if (!text.startsWith(DiscoveryPorts.BEACON_PREFIX)) return null
        val json = text.removePrefix(DiscoveryPorts.BEACON_PREFIX)
        return try {
            val obj = JSONObject(json)
            if (obj.optString("service") != DiscoveryPorts.SERVICE) return null
            val host = obj.optString("host").ifBlank { return null }
            val wsUrl = obj.optString("wsUrl").ifBlank { "ws://$host:8088/ws" }
            DiscoveredServer(
                name = obj.optString("name").ifBlank { "Match" },
                host = host,
                wsUrl = wsUrl,
                sipDomain = obj.optString("sipDomain").ifBlank { host },
                apiBase = obj.optString("apiBase").ifBlank { "http://$host:3001" },
                fromPort = fromPort,
            )
        } catch (_: Exception) {
            null
        }
    }
}
