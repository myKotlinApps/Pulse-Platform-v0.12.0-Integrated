package com.ecupulse.app.transport

interface ObdTransport {
    val label: String
    suspend fun connect()
    suspend fun write(command: String)
    suspend fun writeRaw(bytes: ByteArray)
    suspend fun readUntilPrompt(timeoutMs: Long = 5_000): String
    suspend fun readChunk(timeoutMs: Long = 1_000): ByteArray
    suspend fun close()
}
