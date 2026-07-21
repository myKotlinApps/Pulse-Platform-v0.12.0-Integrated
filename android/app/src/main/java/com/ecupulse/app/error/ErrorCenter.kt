package com.ecupulse.app.error

import android.content.Context
import android.os.Build
import com.ecupulse.app.BuildConfig
import com.ecupulse.app.api.AnalysisApiClient
import com.ecupulse.app.model.AppErrorRecord
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.TimeoutException

class ErrorCenter(private val context: Context) {
    private val directory = File(context.filesDir, "error_reports").apply { mkdirs() }
    private val file = File(directory, "reports.jsonl")
    private val _errors = MutableStateFlow(load())
    val errors: StateFlow<List<AppErrorRecord>> = _errors.asStateFlow()
    private var api: AnalysisApiClient? = null

    fun attachApi(apiClient: AnalysisApiClient) { api = apiClient }

    fun installGlobalHandler() {
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            runCatching { report(throwable, "fatal/${thread.name}", recoverable = false, showToUser = false) }
            previous?.uncaughtException(thread, throwable)
        }
    }

    fun report(
        throwable: Throwable,
        component: String,
        recoverable: Boolean = true,
        showToUser: Boolean = true,
        metadata: Map<String, String> = emptyMap()
    ): AppErrorRecord {
        if (throwable is CancellationException) throw throwable
        val mapped = map(throwable)
        val record = AppErrorRecord(
            id = UUID.randomUUID().toString(),
            code = mapped.first,
            title = mapped.second,
            detail = "${throwable::class.java.simpleName}: ${throwable.message ?: "بدون توضیح"}",
            component = component,
            timestamp = System.currentTimeMillis(),
            recoverable = recoverable,
            metadata = sanitize(metadata + mapOf("stackHash" to stackHash(throwable)))
        )
        append(record)
        _errors.value = (_errors.value + record).takeLast(100)
        return record
    }

    suspend fun send(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        val record = _errors.value.firstOrNull { it.id == id } ?: return@withContext Result.failure(IllegalArgumentException("گزارش پیدا نشد"))
        val client = api ?: return@withContext Result.failure(IllegalStateException("API آماده نیست"))
        runCatching {
            client.sendError(record)
            val updated = _errors.value.map { if (it.id == id) it.copy(sent = true) else it }
            _errors.value = updated
            rewrite(updated)
        }
    }

    suspend fun sendPending(): Int {
        var sent = 0
        errors.value.filterNot { it.sent }.forEach { if (send(it.id).isSuccess) sent++ }
        return sent
    }

    private fun map(t: Throwable): Pair<String, String> = when (t) {
        is SecurityException -> "PERMISSION_DENIED" to "مجوز لازم داده نشده است"
        is SocketTimeoutException, is TimeoutException -> "CONNECTION_TIMEOUT" to "زمان پاسخ اتصال تمام شد"
        is SocketException -> "CONNECTION_LOST" to "ارتباط با ماژول قطع شد"
        is IOException -> "IO_ERROR" to "خطای خواندن یا نوشتن داده"
        is IllegalArgumentException -> "INVALID_DATA" to "داده دریافتی معتبر نیست"
        else -> "UNKNOWN_ERROR" to "خطای ناشناخته"
    }

    private fun sanitize(values: Map<String, String>): Map<String, String> = values
        .filterKeys { !it.contains("token", true) && !it.contains("password", true) && !it.contains("secret", true) && !it.contains("vin", true) }
        .mapValues { it.value.take(500) }

    private fun stackHash(t: Throwable): String {
        val text = t.stackTrace.take(12).joinToString("|") { "${it.className}.${it.methodName}:${it.lineNumber}" }
        return MessageDigest.getInstance("SHA-256").digest(text.toByteArray()).take(8).joinToString("") { "%02x".format(it) }
    }

    private fun append(record: AppErrorRecord) {
        file.appendText(toJson(record).toString() + "\n")
        if (file.length() > 512 * 1024) rewrite(_errors.value.takeLast(80))
    }

    private fun rewrite(items: List<AppErrorRecord>) { file.writeText(items.joinToString("\n") { toJson(it).toString() } + if (items.isEmpty()) "" else "\n") }

    private fun load(): List<AppErrorRecord> = runCatching {
        if (!file.exists()) emptyList() else file.readLines().takeLast(100).mapNotNull { line -> runCatching { fromJson(JSONObject(line)) }.getOrNull() }
    }.getOrDefault(emptyList())

    private fun toJson(x: AppErrorRecord) = JSONObject().apply {
        put("id", x.id); put("code", x.code); put("title", x.title); put("detail", x.detail); put("component", x.component)
        put("timestamp", x.timestamp); put("recoverable", x.recoverable); put("sent", x.sent); put("metadata", JSONObject(x.metadata))
        put("appVersion", BuildConfig.VERSION_NAME); put("android", Build.VERSION.SDK_INT)
    }
    private fun fromJson(x: JSONObject) = AppErrorRecord(
        id=x.getString("id"), code=x.optString("code","UNKNOWN_ERROR"), title=x.optString("title","خطای ناشناخته"), detail=x.optString("detail"), component=x.optString("component"), timestamp=x.optLong("timestamp"), recoverable=x.optBoolean("recoverable",true), sent=x.optBoolean("sent",false), metadata=buildMap { val m=x.optJSONObject("metadata")?:return@buildMap; m.keys().forEach { put(it,m.optString(it)) } }
    )
}
