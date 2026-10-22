package live.zerolag.match.calltest.sip

import java.security.MessageDigest
import java.util.Locale
import java.util.UUID

object SipDigest {
    fun authorize(
        username: String,
        password: String,
        method: String,
        uri: String,
        wwwAuthenticate: String,
        nc: String = "00000001",
    ): String {
        val params = parseAuthParams(wwwAuthenticate)
        val realm = params["realm"] ?: ""
        val nonce = params["nonce"] ?: ""
        val opaque = params["opaque"]
        val qop = params["qop"]?.split(',')?.map { it.trim() }?.firstOrNull()
        val algorithm = params["algorithm"] ?: "MD5"

        val ha1 = md5("$username:$realm:$password")
        val ha2 = md5("$method:$uri")
        val cnonce = UUID.randomUUID().toString().replace("-", "").take(16)

        val response = if (qop != null) {
            md5("$ha1:$nonce:$nc:$cnonce:$qop:$ha2")
        } else {
            md5("$ha1:$nonce:$ha2")
        }

        val sb = StringBuilder()
        sb.append("Digest username=\"").append(username).append("\"")
        sb.append(", realm=\"").append(realm).append("\"")
        sb.append(", nonce=\"").append(nonce).append("\"")
        sb.append(", uri=\"").append(uri).append("\"")
        sb.append(", response=\"").append(response).append("\"")
        sb.append(", algorithm=").append(algorithm)
        if (opaque != null) sb.append(", opaque=\"").append(opaque).append("\"")
        if (qop != null) {
            sb.append(", qop=").append(qop)
            sb.append(", nc=").append(nc)
            sb.append(", cnonce=\"").append(cnonce).append("\"")
        }
        return sb.toString()
    }

    private fun parseAuthParams(header: String): Map<String, String> {
        val body = header
            .removePrefix("Digest")
            .trim()
            .removePrefix(",")
            .trim()
        val out = linkedMapOf<String, String>()
        val regex = Regex("""(\w+)=(?:"([^"]*)"|([^,\s]+))""")
        for (m in regex.findAll(body)) {
            val key = m.groupValues[1].lowercase(Locale.US)
            val value = m.groupValues[2].ifEmpty { m.groupValues[3] }
            out[key] = value
        }
        return out
    }

    private fun md5(input: String): String {
        val digest = MessageDigest.getInstance("MD5").digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }
}
