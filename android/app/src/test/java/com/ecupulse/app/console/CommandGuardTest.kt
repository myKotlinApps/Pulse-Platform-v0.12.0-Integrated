package com.ecupulse.app.console

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CommandGuardTest {
    @Test fun readCommandsAreAllowed() {
        assertTrue(CommandGuard.isAllowed("ATI"))
        assertTrue(CommandGuard.isAllowed("010C"))
        assertTrue(CommandGuard.isAllowed("0902"))
    }

    @Test fun writeAndProgrammingCommandsAreBlocked() {
        assertFalse(CommandGuard.isAllowed("04"))
        assertFalse(CommandGuard.isAllowed("2E F1 90"))
        assertFalse(CommandGuard.isAllowed("27 01"))
    }

    @Test fun extendedReadRequiresExplicitOptIn() {
        assertFalse(CommandGuard.isAllowed("22F190"))
        assertTrue(CommandGuard.isAllowed("22F190", extendedRead = true))
    }
}
