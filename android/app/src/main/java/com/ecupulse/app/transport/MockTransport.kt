package com.ecupulse.app.transport

import kotlinx.coroutines.delay
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.sin

class MockTransport : ObdTransport {
    override val label = "ECU Pulse Demo ELM327"
    private var last = ""
    private var connected = false
    private var sample = 0
    private var dtcsCleared = false
    private var monitorMode = false

    override suspend fun connect() { delay(150); connected = true; sample = 0; dtcsCleared = false }
    override suspend fun write(command: String) {
        check(connected)
        last = command.trim().uppercase()
        monitorMode = last.startsWith("ATMA") || last.startsWith("ATMR") || last.startsWith("ATMT")
    }
    override suspend fun writeRaw(bytes: ByteArray) {
        check(connected)
        val raw = bytes.toString(Charsets.US_ASCII)
        if (raw == "\r" || raw.isBlank()) monitorMode = false else write(raw)
    }
    override suspend fun readUntilPrompt(timeoutMs: Long): String {
        delay(35)
        return response(last) + "\r>"
    }
    override suspend fun readChunk(timeoutMs: Long): ByteArray {
        delay(150)
        if (!monitorMode) return byteArrayOf()
        sample += 1
        val id = listOf("7E8", "7E9", "7E0")[sample % 3]
        val line = "$id 08 04 41 0C %02X %02X 00 00\r".format((sample * 3) and 0xFF, sample and 0xFF)
        return line.toByteArray(Charsets.US_ASCII)
    }
    override suspend fun close() { connected = false; monitorMode = false }

    private fun drive(): Snapshot {
        val phase = (sample++ % 112) / 112.0
        val stop = sample % 42 in 31..36
        val speed = if (stop) 0.0 else max(0.0, 8 + 104 * max(0.0, sin(phase * PI)).pow(1.25) + 8 * sin(phase * PI * 7))
        val rpm = if (stop) 780.0 else 820 + speed * 22 + 420 * abs(sin(phase * PI * 9))
        return Snapshot(speed, rpm, 82 + (12 * minOf(1.0, sample / 80.0)).toInt(), 18 + minOf(54.0, speed * .42 + 18 * abs(sin(phase * PI * 5))))
    }

    private fun response(c: String): String {
        val x = drive()
        return when(c) {
            "ATZ" -> "ELM327 v1.5"; "ATI" -> "Demo ELM327 v1.5"; "ATDP" -> "ISO 15765-4 (CAN 11/500)"; "ATDPN" -> "A6"; "ATRV" -> "%.1fV".format(13.5 + .35 * sin(sample / 8.0))
            "0100" -> "41 00 BE 3F A8 13"; "0120" -> "41 20 80 01 A0 01"
            "010C" -> rpmResponse(x.rpm); "010D" -> "41 0D %02X".format(x.speed.toInt().coerceIn(0,255)); "0105" -> "41 05 %02X".format((x.coolant + 40).coerceIn(0,255)); "0104" -> "41 04 %02X".format((x.load / 100 * 255).toInt().coerceIn(0,255))
            "0902" -> "49 02 01 44 45 4D 4F 45 43 55 50\r49 02 02 55 4C 53 45 30 30 30 31"
            "0904" -> "49 04 01 44 45 4D 4F 2D 4D 45 37 2E 34 2E 35"; "090A" -> "49 0A 01 45 43 55 20 50 55 4C 53 45 20 53 49 4D"
            "03" -> if(dtcsCleared) "43 00 00" else "43 01 33 04 20 00 00"; "07" -> if(dtcsCleared) "47 00 00" else "47 04 20 00 00"; "0A" -> "4A 00 00"
            "04" -> { dtcsCleared = true; "44" }
            else -> "OK"
        }
    }
    private fun rpmResponse(rpm: Double): String { val raw=(rpm*4).toInt().coerceIn(0,65535);return "41 0C %02X %02X".format(raw shr 8,raw and 0xFF) }
    private data class Snapshot(val speed:Double,val rpm:Double,val coolant:Int,val load:Double)
}
