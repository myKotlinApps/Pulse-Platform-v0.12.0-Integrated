package com.ecupulse.app.transport

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStream

abstract class StreamTransport : ObdTransport {
    protected var input: InputStream? = null
    protected var output: OutputStream? = null

    override suspend fun write(command: String) {
        writeRaw((command.trim() + "\r").toByteArray(Charsets.US_ASCII))
    }

    override suspend fun writeRaw(bytes: ByteArray) = withContext(Dispatchers.IO) {
        requireNotNull(output) { "Transport is not connected" }.apply {
            write(bytes)
            flush()
        }
    }

    override suspend fun readUntilPrompt(timeoutMs: Long): String = withTimeout(timeoutMs) {
        val buffer = ByteArrayOutputStream()
        while (true) {
            val chunk = readChunk(minOf(timeoutMs, 1_000))
            if (chunk.isEmpty()) continue
            buffer.write(chunk)
            if (chunk.any { it.toInt().toChar() == '>' }) return@withTimeout buffer.toString("US-ASCII")
            if (buffer.size() > 65_536) error("ELM327 response exceeded safety limit")
        }
        @Suppress("UNREACHABLE_CODE") ""
    }

    override suspend fun readChunk(timeoutMs: Long): ByteArray = withTimeout(timeoutMs) {
        val stream = requireNotNull(input) { "Transport is not connected" }
        while (true) {
            val available = withContext(Dispatchers.IO) { stream.available() }
            if (available <= 0) {
                delay(8)
                continue
            }
            val chunk = ByteArray(minOf(available, 512))
            val count = withContext(Dispatchers.IO) { stream.read(chunk) }
            if (count < 0) error("Connection closed")
            return@withTimeout chunk.copyOf(count)
        }
        @Suppress("UNREACHABLE_CODE") byteArrayOf()
    }
}
