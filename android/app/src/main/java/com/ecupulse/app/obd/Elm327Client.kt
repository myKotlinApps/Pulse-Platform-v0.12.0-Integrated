package com.ecupulse.app.obd

import com.ecupulse.app.model.*
import com.ecupulse.app.transport.ObdTransport
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.isActive
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class Elm327Client(
    private val transport: ObdTransport,
    private val logger: (direction: String, data: String) -> Unit
) {
    private val mutex = Mutex()

    suspend fun command(command: String, timeoutMs: Long = 5_000): String = mutex.withLock {
        logger("TX", command)
        transport.write(command)
        val response = transport.readUntilPrompt(timeoutMs)
        logger("RX", response)
        response
    }

    suspend fun initialize(profileCommands: List<String> = listOf("ATSP0")): DetectionResult {
        command("ATZ", 8_000)
        command("ATE0")
        command("ATL0")
        command("ATS0")
        command("ATH1")
        command("ATAT1")
        command("ATST96")
        command("ATI")
        command("ATRV")
        (profileCommands.ifEmpty { listOf("ATSP0") }).forEach { command(it) }
        val adapter = command("ATI").replace(">", "").trim()
        val protocol = command("ATDP").replace(">", "").trim()
        val protocolNumber = command("ATDPN").replace(">", "").trim()
        val supported = mutableSetOf<Int>()
        listOf(0x00,0x20,0x40,0x60,0x80,0xA0).forEach { base ->
            val raw = command("01%02X".format(base))
            val found = ObdParsers.parseSupportedPids(raw, base)
            supported += found
            if (!found.contains(base + 0x20)) return@forEach
        }
        val vin = runCatching { ObdParsers.parseVin(command("0902", 8_000)) }.getOrNull()
        val cal = runCatching { ObdParsers.parseAsciiMode09(command("0904", 8_000), 0x04, "0904") }.getOrNull()
        val name = runCatching { ObdParsers.parseAsciiMode09(command("090A", 8_000), 0x0A, "090A") }.getOrNull()
        val confidence = listOf(protocol.isNotBlank(), vin != null, cal != null, name != null).count { it } * 25
        return DetectionResult(adapter, protocol, protocolNumber, vin, cal, name, supported, confidence)
    }

    suspend fun monitor(command: String, onChunk: (String) -> Unit) = mutex.withLock {
        logger("TX", command)
        transport.write(command)
        try {
            while (currentCoroutineContext().isActive) {
                val bytes = try {
                    transport.readChunk(1_500)
                } catch (_: TimeoutCancellationException) {
                    continue
                }
                if (bytes.isEmpty()) continue
                val text = bytes.toString(Charsets.US_ASCII).replace("\u0000", "")
                logger("MON", text)
                onChunk(text)
            }
        } finally {
            runCatching { transport.writeRaw("\r".toByteArray(Charsets.US_ASCII)) }
            logger("TX", "<CR>")
            runCatching { transport.readUntilPrompt(1_500) }
        }
    }

    suspend fun readDtcs(): List<DtcRecord> = buildList {
        addAll(ObdParsers.parseDtcs(command("03", 8_000), DtcKind.STORED, 0x43, "03"))
        addAll(ObdParsers.parseDtcs(command("07", 8_000), DtcKind.PENDING, 0x47, "07"))
        addAll(ObdParsers.parseDtcs(command("0A", 8_000), DtcKind.PERMANENT, 0x4A, "0A"))
    }.distinctBy { it.kind to it.code }

    suspend fun clearGenericDtcs(engineOffConfirmed: Boolean, explicitPhrase: String, currentRpm: Double?): ClearDtcResult {
        if (!engineOffConfirmed) return ClearDtcResult(false, "خاموش‌بودن موتور تأیید نشده است")
        if (explicitPhrase.trim() != "پاک شود") return ClearDtcResult(false, "عبارت تأیید درست نیست")
        val freshRpm = runCatching { ObdParsers.parseRpm(command("010C")) }.getOrNull() ?: currentRpm
        if (freshRpm != null && freshRpm > 50.0) return ClearDtcResult(false, "موتور روشن است؛ موتور را خاموش و سوییچ را باز نگه دارید")
        val raw = command("04", 8_000)
        return if (ObdParsers.isPositiveClearResponse(raw)) ClearDtcResult(true, "خطاهای عمومی موتور پاک شدند؛ Readiness دوباره باید تکمیل شود", raw)
        else ClearDtcResult(false, "ECU پاسخ مثبت Mode 04 نداد", raw)
    }
}
