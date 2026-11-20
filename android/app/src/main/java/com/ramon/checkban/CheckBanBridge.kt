package com.ramon.checkban

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/* --- Bridge nativo: consulta de banimento direto na Garena, sem servidor. --- */
class CheckBanBridge(private val context: Context) {

    @android.webkit.JavascriptInterface
    fun checkBan(uid: String): String {
        val clean = uid.trim()
        if (!clean.matches(Regex("\\d{6,12}"))) {
            return """{"error":"UID inválido: use de 6 a 12 dígitos."}"""
        }
        val labels = mapOf(
            1 to "1 semana", 2 to "1 mês", 3 to "3 meses",
            4 to "6 meses", 5 to "1 ano", 6 to "permanente"
        )
        return try {
            val url = URL("https://ff.garena.com/api/antihack/check_banned?lang=en&uid=$clean")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
            conn.setRequestProperty("Accept", "application/json, text/plain, */*")
            conn.setRequestProperty("referer", "https://ff.garena.com/en/support/")
            conn.setRequestProperty("x-requested-with", "B6FksShzIgjfrYImLpTsadjS86sddhFH")
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val body = stream?.bufferedReader()?.readText() ?: ""
            conn.disconnect()
            if (code != 200) {
                return """{"error":"Garena respondeu HTTP $code."}"""
            }
            val json = JSONObject(body)
            if (json.optString("status") != "success" || !json.has("data")) {
                val msg = json.optString("msg", "resposta sem status")
                return if (msg == "T_P_WRONG_ACCOUNT") {
                    """{"error":"UID não encontrado."}"""
                } else {
                    """{"error":"Garena recusou a consulta: $msg"}"""
                }
            }
            val data = json.getJSONObject("data")
            val isBanned = data.optInt("is_banned", 0)
            val period = if (isBanned == 1) data.optInt("period", 0) else 0
            val label = if (isBanned == 1) (labels[period] ?: "não informado") else ""
            val status = if (isBanned == 1) "banned" else "clean"
            val message = if (isBanned == 1) "Banido: $label." else "Conta limpa: nenhum banimento ativo."
            """{"uid":"$clean","banned":${isBanned == 1},"is_banned":$isBanned,"period":$period,"period_label":"$label","status":"$status","message":"$message","nickname":null,"region":null,"elapsed_ms":0}"""
        } catch (e: Exception) {
            """{"error":"Falha ao consultar a API: ${e.message}"}"""
        }
    }
}
