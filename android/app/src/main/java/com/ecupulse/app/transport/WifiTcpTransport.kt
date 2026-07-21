package com.ecupulse.app.transport

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

class WifiTcpTransport(private val host: String, private val port: Int) : StreamTransport() {
    override val label: String = "Wi-Fi $host:$port"
    private var socket: Socket? = null
    override suspend fun connect() = withContext(Dispatchers.IO) {
        val candidate = Socket().apply { tcpNoDelay = true; keepAlive = true; soTimeout = 5_000; connect(InetSocketAddress(host, port), 5_000) }
        socket = candidate; input = candidate.getInputStream(); output = candidate.getOutputStream()
    }
    override suspend fun close() = withContext(Dispatchers.IO) {
        runCatching { input?.close() }; runCatching { output?.close() }; runCatching { socket?.close() }
        input = null; output = null; socket = null
    }
}
