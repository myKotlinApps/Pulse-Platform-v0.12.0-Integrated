package com.ecupulse.app.console

import android.content.Context
import android.os.Environment
import org.json.JSONObject
import java.io.BufferedWriter
import java.io.Closeable
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStreamWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class EcuSessionLogger(context: Context) : Closeable {
    private val lock = Any()
    private val directory = (context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS) ?: context.filesDir)
        .resolve("ecu-pulse-logs")
        .apply { mkdirs() }
    private var writer: BufferedWriter? = null
    private var currentFile: File = createFile()
    private var count: Long = 0

    init {
        open(currentFile)
        event("SYS", "SESSION_START", mapOf("format" to "ECU_PULSE_JSONL_V1"))
    }

    private fun createFile(): File {
        val stamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
        return directory.resolve("ecu-pulse-$stamp.jsonl")
    }

    private fun open(file: File) {
        writer = BufferedWriter(OutputStreamWriter(FileOutputStream(file, true), Charsets.UTF_8))
        currentFile = file
    }

    fun event(direction: String, data: String, meta: Map<String, String> = emptyMap()) {
        val json = JSONObject()
            .put("ts", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).format(Date()))
            .put("direction", direction)
            .put("data", data.replace(Regex("[\\r\\n]+$"), ""))
        meta.forEach { (key, value) -> json.put(key, value) }
        synchronized(lock) {
            writer?.apply {
                write(json.toString())
                newLine()
                flush()
            }
            count += 1
        }
    }

    fun newSession(): File = synchronized(lock) {
        writer?.close()
        count = 0
        val file = createFile()
        open(file)
        event("SYS", "SESSION_START", mapOf("format" to "ECU_PULSE_JSONL_V1"))
        file
    }

    fun file(): File = currentFile
    fun entries(): Long = count

    override fun close() {
        synchronized(lock) {
            writer?.flush()
            writer?.close()
            writer = null
        }
    }
}
