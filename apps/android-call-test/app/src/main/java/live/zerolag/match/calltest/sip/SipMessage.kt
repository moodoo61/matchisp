package live.zerolag.match.calltest.sip

data class SipMessage(
    val startLine: String,
    val headers: Map<String, String>,
    val body: String = "",
) {
    val isRequest: Boolean get() = !startLine.startsWith("SIP/")
    val method: String?
        get() = if (isRequest) startLine.substringBefore(' ').uppercase() else null
    val statusCode: Int?
        get() = if (!isRequest) {
            startLine.split(' ').getOrNull(1)?.toIntOrNull()
        } else null

    fun header(name: String): String? {
        val key = name.lowercase()
        return headers.entries.firstOrNull { it.key.lowercase() == key }?.value
            ?: headers(name).firstOrNull()
    }

    /** كل قيم ترويسة متعددة الأسطر (مثل Via) بالترتيب */
    fun headers(name: String): List<String> {
        val key = name.lowercase()
        return headers.entries
            .filter { it.key.lowercase() == key || it.key.lowercase().startsWith("$key.") }
            .map { it.value }
    }

    fun toWire(): String {
        val sb = StringBuilder()
        sb.append(startLine).append("\r\n")
        for ((k, v) in headers) {
            val name = k.substringBefore('.')
            sb.append(name).append(": ").append(v).append("\r\n")
        }
        sb.append("\r\n")
        if (body.isNotEmpty()) sb.append(body)
        return sb.toString()
    }

    companion object {
        fun parse(raw: String): SipMessage? {
            val normalized = raw.replace("\r\n", "\n")
            val parts = normalized.split("\n\n", limit = 2)
            val head = parts[0]
            val body = parts.getOrElse(1) { "" }
            val lines = head.split('\n').filter { it.isNotEmpty() }
            if (lines.isEmpty()) return null
            val headers = linkedMapOf<String, String>()
            var viaIdx = 0
            for (i in 1 until lines.size) {
                val idx = lines[i].indexOf(':')
                if (idx <= 0) continue
                val k = lines[i].substring(0, idx).trim()
                val v = lines[i].substring(idx + 1).trim()
                if (k.equals("Via", ignoreCase = true) || k.equals("v", ignoreCase = true)) {
                    headers["Via.$viaIdx"] = v
                    viaIdx++
                } else {
                    headers[k] = v
                }
            }
            return SipMessage(lines[0].trim(), headers, body)
        }
    }
}
