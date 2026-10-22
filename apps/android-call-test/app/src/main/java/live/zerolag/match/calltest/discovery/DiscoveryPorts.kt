package live.zerolag.match.calltest.discovery

/** يجب أن تطابق apps/api/.../constants/discovery-ports.ts */
object DiscoveryPorts {
    val ALL: IntArray = intArrayOf(
        18760, 18761, 18762, 18763, 18764,
        18765, 18766, 18767, 18768, 18769,
    )
    const val SERVICE = "match-comms"
    const val PROBE = "MATCH_DISCOVER"
    const val BEACON_PREFIX = "MATCH_BEACON "
}
