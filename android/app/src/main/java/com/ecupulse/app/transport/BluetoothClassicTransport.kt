package com.ecupulse.app.transport

import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.util.UUID

class BluetoothClassicTransport(private val context: Context, private val address: String) : StreamTransport() {
    override val label: String = "Bluetooth $address"
    private var socket: BluetoothSocket? = null

    @SuppressLint("MissingPermission")
    override suspend fun connect() = withContext(Dispatchers.IO) {
        val adapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
            ?: error("Bluetooth در دسترس نیست")
        check(adapter.isEnabled) { "Bluetooth خاموش است" }
        adapter.cancelDiscovery()
        val device = adapter.getRemoteDevice(address)
        var lastError: Throwable? = null
        val candidates = listOf(
            { device.createRfcommSocketToServiceRecord(SPP_UUID) },
            { device.createInsecureRfcommSocketToServiceRecord(SPP_UUID) }
        )
        for (factory in candidates) {
            val candidate = factory()
            try {
                withTimeout(12_000) { candidate.connect() }
                socket = candidate
                input = candidate.inputStream
                output = candidate.outputStream
                return@withContext
            } catch (error: Throwable) {
                lastError = error
                runCatching { candidate.close() }
            }
        }
        throw IllegalStateException("اتصال RFCOMM/SPP برقرار نشد", lastError)
    }

    override suspend fun close() = withContext(Dispatchers.IO) {
        runCatching { input?.close() }
        runCatching { output?.close() }
        runCatching { socket?.close() }
        input = null
        output = null
        socket = null
    }

    companion object {
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }
}
