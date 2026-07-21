package com.ecupulse.app.obd

import com.ecupulse.app.model.DtcKind
import com.ecupulse.app.model.DtcRecord

object ObdParsers {
    private val hexByte = Regex("^[0-9A-Fa-f]{2}$")

    fun cleanLines(raw: String, command: String? = null): List<List<Int>> = raw
        .replace(">", "")
        .lines()
        .map { it.trim() }
        .filter { it.isNotBlank() && !it.contains("SEARCHING", true) && !it.contains("BUS INIT", true) }
        .filterNot { command != null && it.replace(" ", "").equals(command.replace(" ", ""), true) }
        .mapNotNull { line ->
            val bytes = line.split(Regex("\\s+")).filter { hexByte.matches(it) }.map { it.toInt(16) }
            bytes.takeIf { it.isNotEmpty() }
        }

    fun findPayload(raw: String, responseMode: Int, pid: Int? = null, command: String? = null): List<Int>? {
        cleanLines(raw, command).forEach { bytes ->
            for (i in bytes.indices) {
                if (bytes[i] == responseMode && (pid == null || bytes.getOrNull(i + 1) == pid)) {
                    return bytes.drop(i + if (pid == null) 1 else 2)
                }
            }
        }
        return null
    }

    fun parseRpm(raw: String): Double? = findPayload(raw, 0x41, 0x0C, "010C")?.let { p -> if (p.size >= 2) ((p[0] * 256) + p[1]) / 4.0 else null }
    fun parseSpeed(raw: String): Int? = findPayload(raw, 0x41, 0x0D, "010D")?.firstOrNull()
    fun parseCoolant(raw: String): Int? = findPayload(raw, 0x41, 0x05, "0105")?.firstOrNull()?.minus(40)
    fun parseLoad(raw: String): Double? = findPayload(raw, 0x41, 0x04, "0104")?.firstOrNull()?.times(100.0)?.div(255.0)
    fun parseVoltage(raw: String): Double? = Regex("([0-9]+(?:\\.[0-9]+)?)V", RegexOption.IGNORE_CASE).find(raw)?.groupValues?.get(1)?.toDoubleOrNull()

    fun parseSupportedPids(raw: String, base: Int): Set<Int> {
        val p = findPayload(raw, 0x41, base, "01%02X".format(base)) ?: return emptySet()
        if (p.size < 4) return emptySet()
        val bits = ((p[0].toLong() shl 24) or (p[1].toLong() shl 16) or (p[2].toLong() shl 8) or p[3].toLong())
        return (1..32).filter { offset -> bits and (1L shl (32 - offset)) != 0L }.map { base + it }.toSet()
    }

    fun parseVin(raw: String): String? {
        val chunks = mutableListOf<Pair<Int, List<Int>>>()
        cleanLines(raw, "0902").forEach { b ->
            val idx = b.indexOfFirst { it == 0x49 }
            if (idx >= 0 && b.getOrNull(idx + 1) == 0x02) {
                val sequence = b.getOrNull(idx + 2) ?: 0
                chunks += sequence to b.drop(idx + 3)
            }
        }
        val text = chunks.sortedBy { it.first }.flatMap { it.second }.filter { it in 0x20..0x7E }.map { it.toChar() }.joinToString("").trim()
        return text.takeIf { it.length in 11..20 }
    }

    fun parseAsciiMode09(raw: String, pid: Int, command: String): String? {
        val chunks = cleanLines(raw, command).mapNotNull { b ->
            val idx = b.indexOfFirst { it == 0x49 }
            if (idx >= 0 && b.getOrNull(idx + 1) == pid) (b.getOrNull(idx + 2) ?: 0) to b.drop(idx + 3) else null
        }
        return chunks.sortedBy { it.first }.flatMap { it.second }.filter { it in 0x20..0x7E }.map { it.toChar() }.joinToString("").trim().takeIf { it.isNotBlank() }
    }

    fun parseDtcs(raw: String, kind: DtcKind, responseMode: Int, command: String): List<DtcRecord> {
        val result = linkedSetOf<String>()
        cleanLines(raw, command).forEach { b ->
            val idx = b.indexOfFirst { it == responseMode }
            if (idx < 0) return@forEach
            val payload = b.drop(idx + 1)
            payload.chunked(2).forEach { pair ->
                if (pair.size == 2 && !(pair[0] == 0 && pair[1] == 0)) result += decodeDtc(pair[0], pair[1])
            }
        }
        return result.map { DtcRecord(it, kind) }
    }

    fun decodeDtc(a: Int, b: Int): String {
        val system = charArrayOf('P','C','B','U')[(a shr 6) and 0x03]
        val firstDigit = (a shr 4) and 0x03
        return "%c%d%01X%02X".format(system, firstDigit, a and 0x0F, b)
    }

    fun isPositiveClearResponse(raw: String): Boolean = raw.contains(Regex("(^|\\s)44(\\s|$)")) || raw.contains("OK", true)
}
