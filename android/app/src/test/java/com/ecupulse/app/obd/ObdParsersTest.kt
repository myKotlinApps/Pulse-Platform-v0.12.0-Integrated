package com.ecupulse.app.obd
import com.ecupulse.app.model.DtcKind
import org.junit.Assert.*
import org.junit.Test
class ObdParsersTest {
 @Test fun rpm(){assertEquals(2160.0,ObdParsers.parseRpm("41 0C 21 C0>"))}
 @Test fun speed(){assertEquals(74,ObdParsers.parseSpeed("7E8 03 41 0D 4A>"))}
 @Test fun dtc(){assertEquals(listOf("P0133","P0420"),ObdParsers.parseDtcs("7E8 06 43 01 33 04 20 00 00>",DtcKind.STORED,0x43,"03").map{it.code})}
 @Test fun vin(){assertEquals("IR0012345678901234",ObdParsers.parseVin("49 02 01 49 52 30 30 31 32 33 3449 02 02 35 36 37 38 39 30 31 3249 02 03 33 34>"))}
 @Test fun positiveClear(){assertTrue(ObdParsers.isPositiveClearResponse("44>"))}
}
