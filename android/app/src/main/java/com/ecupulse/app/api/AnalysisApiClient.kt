package com.ecupulse.app.api

import android.content.Context
import android.provider.Settings
import com.ecupulse.app.BuildConfig
import com.ecupulse.app.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class AnalysisApiClient(private val context: Context) {
    private val prefs = context.getSharedPreferences("api_auth", Context.MODE_PRIVATE)
    private var token: String? = null
    private var tokenExpiry: Long = 0
    private var activeBase: String = prefs.getString("active_api", null) ?: "http://127.0.0.1:4030"

    fun setBases(remote: String, local: String) {
        prefs.edit().putString("remote_api", remote.trimEnd('/')).putString("local_api", local.trimEnd('/')).apply()
    }
    fun invalidateToken(){ token=null; tokenExpiry=0 }

    fun bases(): List<String> = listOf(
        prefs.getString("local_api", "http://127.0.0.1:4030") ?: "http://127.0.0.1:4030",
        prefs.getString("remote_api", "https://diageman.ir") ?: "https://diageman.ir"
    ).map { it.trimEnd('/') }.distinct()

    suspend fun entitlement(): EntitlementState {
        val json = request("GET", "/api/v1/entitlements/me")
        return EntitlementState(
            plan = if (json.optString("plan") == "pro") UserPlan.PRO else UserPlan.FREE,
            clearDtcLimit = json.optInt("clearDtcLimit", 5),
            clearDtcUsed = json.optInt("clearDtcUsed", 0),
            verifiedAt = System.currentTimeMillis(), onlineVerified = true
        )
    }

    suspend fun authorizeDtcClear(): String = request("POST", "/api/v1/actions/dtc-clear/authorize", JSONObject()).getString("actionToken")
    suspend fun completeDtcClear(actionToken: String, success: Boolean) {
        raw("POST", "/api/v1/actions/dtc-clear/complete", JSONObject().put("success", success), overrideToken = actionToken)
    }

    suspend fun offers(): List<StoreOffer> {
        val array = request("GET", "/api/v1/offers").optJSONArray("offers") ?: JSONArray()
        return (0 until array.length()).map { array.getJSONObject(it) }.map { StoreOffer(it.getString("id"), it.getString("titleFa"), it.getLong("basePrice"), it.getString("currency")) }
    }

    suspend fun coupon(code: String, offerId: String): CouponQuote {
        val x = request("POST", "/api/v1/coupons/quote", JSONObject().put("code", code).put("offerId", offerId).put("store", BuildConfig.STORE_NAME))
        return CouponQuote(x.getString("quoteId"),x.getString("offerId"),x.getInt("percent"),x.getLong("basePrice"),x.getLong("finalPrice"),x.getString("currency"),x.optString("storeProductId").ifBlank{null},x.optString("storeOfferId").ifBlank{null},x.getLong("expiresAt"),x.getString("signature"))
    }

    suspend fun analyze(vehicle: VehicleProfile?, live: LiveDataSnapshot, dtcs: List<DtcRecord>): AnalysisReport {
        val body = JSONObject().apply {
            vehicle?.let { put("vehicle", JSONObject().put("make",it.make).put("model",it.model).put("profile",it.profile)) }
            put("live", JSONObject().put("rpm",live.rpm).put("speedKph",live.speedKph).put("coolantC",live.coolantC).put("voltage",live.voltage).put("engineLoad",live.engineLoad))
            put("dtcs", JSONArray().apply { dtcs.forEach { put(JSONObject().put("code",it.code).put("kind",it.kind.name).put("description",it.description)) } })
        }
        val x = request("POST", "/api/v1/analyze", body)
        val alerts = x.optJSONArray("alerts") ?: JSONArray()
        return AnalysisReport(x.getString("reportId"), x.getString("generatedAt"), x.getInt("score"), x.getString("summary"), (0 until alerts.length()).map { alerts.getJSONObject(it) }.map { AnalysisAlert(it.optString("severity"),it.optString("title"),it.optString("detail")) })
    }

    suspend fun pdf(report: AnalysisReport): ByteArray {
        val body = JSONObject().put("reportId",report.reportId).put("generatedAt",report.generatedAt).put("score",report.score).put("summary",report.summary).put("alerts", JSONArray().apply { report.alerts.forEach { put(JSONObject().put("severity",it.severity).put("title",it.title).put("detail",it.detail)) } })
        return rawBytes("POST", "/api/v1/reports/pdf", body)
    }

    suspend fun sendError(error: AppErrorRecord) {
        request("POST", "/api/v1/errors/report", JSONObject().apply {
            put("appVersion", BuildConfig.VERSION_NAME); put("platform", "android-${BuildConfig.PLATFORM_FLAVOR}-${BuildConfig.STORE_NAME}")
            put("code",error.code);put("title",error.title);put("detail",error.detail);put("context",JSONObject(error.metadata + mapOf("component" to error.component)))
        })
    }

    private suspend fun request(method: String, path: String, body: JSONObject? = null): JSONObject = JSONObject(raw(method,path,body).toString(Charsets.UTF_8))
    private suspend fun rawBytes(method: String, path: String, body: JSONObject?): ByteArray = raw(method,path,body)

    private suspend fun raw(method: String, path: String, body: JSONObject?, overrideToken: String? = null): ByteArray = withContext(Dispatchers.IO) {
        val auth = overrideToken ?: ensureToken()
        var last: Throwable? = null
        repeat(2) { attempt ->
            try { return@withContext call(activeBase, method, path, body, auth) }
            catch (t: Throwable) { last=t; if(attempt==0) delay(450) }
        }
        throw last ?: IllegalStateException("API failed")
    }

    private suspend fun ensureToken(): String {
        if (token != null && System.currentTimeMillis() < tokenExpiry) return token!!
        var last: Throwable? = null
        for (base in bases()) {
            try {
                val installationId = prefs.getString("installation_id", null) ?: UUID.randomUUID().toString().also { prefs.edit().putString("installation_id",it).apply() }
                val payload = JSONObject().put("clientId","ecu-pulse-mobile").put("installationId",installationId).put("store",BuildConfig.STORE_NAME).put("devMode",BuildConfig.ALLOW_DEV_AUTH).put("requestedPlan",if(context.getSharedPreferences("ecu_pulse_settings",Context.MODE_PRIVATE).getBoolean("dev_pro_unlocked",false)) "pro" else "free")
                val response = JSONObject(call(base,"POST","/api/v1/auth/exchange",payload,null).toString(Charsets.UTF_8))
                activeBase=base;prefs.edit().putString("active_api",base).apply();token=response.getString("accessToken");tokenExpiry=System.currentTimeMillis()+(response.optLong("expiresIn",900)-30)*1000;return token!!
            } catch (t: Throwable) { last=t }
        }
        throw last ?: IllegalStateException("Server unavailable")
    }

    private fun call(base: String, method: String, path: String, body: JSONObject?, auth: String?): ByteArray {
        val connection=(URL(base+path).openConnection() as HttpURLConnection).apply { requestMethod=method;connectTimeout=7000;readTimeout=12000;setRequestProperty("Accept","application/json");if(auth!=null)setRequestProperty("Authorization","Bearer $auth");if(body!=null){doOutput=true;setRequestProperty("Content-Type","application/json");outputStream.use{it.write(body.toString().toByteArray())}} }
        val code=connection.responseCode;val bytes=(if(code in 200..299)connection.inputStream else connection.errorStream)?.use{it.readBytes()}?:ByteArray(0)
        if(code !in 200..299){val detail=runCatching{JSONObject(bytes.toString(Charsets.UTF_8)).optJSONObject("error")?.optString("detail")}.getOrNull();throw IllegalStateException("HTTP $code: ${detail?:bytes.toString(Charsets.UTF_8).take(300)}")}
        return bytes
    }
}
