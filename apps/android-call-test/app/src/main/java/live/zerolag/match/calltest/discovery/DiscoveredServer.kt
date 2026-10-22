package live.zerolag.match.calltest.discovery

data class DiscoveredServer(
    val name: String,
    val host: String,
    val wsUrl: String,
    val sipDomain: String,
    val apiBase: String,
    val fromPort: Int,
) {
    override fun toString(): String = "$name ($host) · UDP:$fromPort"
}
