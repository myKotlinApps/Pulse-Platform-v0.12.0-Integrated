package com.ecupulse.app.console

object CommandGuard {
    fun normalize(value: String): String = value.uppercase().replace(Regex("\\s+"), "").replace("\r", "").replace("\n", "")

    fun isAllowed(value: String, extendedRead: Boolean = false): Boolean {
        val command = normalize(value)
        if (command.isBlank()) return false
        if (command.startsWith("AT")) {
            return !Regex("^(ATPP|ATCV|ATSD|AT@3|ATWM|ATBI|ATFI|ATSI)").containsMatchIn(command)
        }
        if (Regex("^(04|08|10|11|14|27|28|2E|2F|31|34|35|36|37|3D|85)").containsMatchIn(command)) return false
        if (Regex("^(01|02|03|06|07|09|0A)[0-9A-F]*$").matches(command)) return true
        return extendedRead && Regex("^(19|1A|21|22)[0-9A-F]+$").matches(command)
    }
}
