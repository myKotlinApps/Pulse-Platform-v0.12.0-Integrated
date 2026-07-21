package com.ecupulse.app.obd

import com.ecupulse.app.transport.MockTransport
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Test

class ElmConsoleMockTest {
    @Test fun commandAndMonitorUseTheSameSerializedClient() = runBlocking {
        val events = mutableListOf<Pair<String, String>>()
        val transport = MockTransport()
        transport.connect()
        val client = Elm327Client(transport) { direction, data -> events += direction to data }
        assertTrue(client.command("010C").contains("41 0C"))
        val frames = mutableListOf<String>()
        val job = launch(Dispatchers.Default) { client.monitor("ATMA") { frames += it } }
        delay(450)
        job.cancel()
        job.join()
        assertTrue(frames.isNotEmpty())
        assertTrue(events.any { it.first == "MON" })
        transport.close()
    }
}
