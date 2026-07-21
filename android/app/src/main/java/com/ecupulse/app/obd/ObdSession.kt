package com.ecupulse.app.obd

import android.content.Context
import com.ecupulse.app.console.CommandGuard
import com.ecupulse.app.console.EcuSessionLogger
import com.ecupulse.app.data.DiagnosticHistoryStore
import com.ecupulse.app.data.SettingsStore
import com.ecupulse.app.data.VehicleCatalog
import com.ecupulse.app.model.*
import com.ecupulse.app.transport.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlin.math.max

class ObdSession(
    private val context: Context,
    private val settingsStore: SettingsStore,
    private val catalog: VehicleCatalog,
    private val history: DiagnosticHistoryStore
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val sessionLogger = EcuSessionLogger(context)
    private val _state = MutableStateFlow(
        MainUiState(
            vehicle = catalog.get(settingsStore.activeVehicleIndex()),
            logFilePath = sessionLogger.file().absolutePath,
            logEntryCount = sessionLogger.entries()
        )
    )
    val state: StateFlow<MainUiState> = _state.asStateFlow()
    private var transport: ObdTransport? = null
    private var client: Elm327Client? = null
    private var pollingJob: Job? = null
    private var monitorJob: Job? = null
    private val rawLogBuffers = mutableMapOf<String, StringBuilder>()
    private var uiVisible = true
    private var keepBackground = false

    private fun log(direction: String, raw: String) {
        val clean = raw.replace("\u0000", "")
        val flushed = mutableListOf<String>()
        if (direction == "TX" || direction == "SYS") {
            clean.trim().takeIf { it.isNotEmpty() }?.let(flushed::add)
        } else {
            val buffer = rawLogBuffers.getOrPut(direction) { StringBuilder() }
            clean.forEach { ch ->
                if (ch == '\r' || ch == '\n' || ch == '>') {
                    val line = buffer.toString().trim()
                    if (line.isNotEmpty()) flushed += line
                    if (ch == '>') flushed += ">"
                    buffer.clear()
                } else buffer.append(ch)
            }
            if (buffer.length > 8_192) {
                flushed += buffer.toString()
                buffer.clear()
            }
        }
        flushed.forEach { sessionLogger.event(direction, it) }
        val compact = flushed.joinToString(" | ").take(220)
        if (compact.isNotBlank()) {
            _state.update {
                it.copy(
                    log = (it.log + "$direction $compact").takeLast(80),
                    logFilePath = sessionLogger.file().absolutePath,
                    logEntryCount = sessionLogger.entries()
                )
            }
        }
    }

    fun setUiVisible(value: Boolean) {
        uiVisible = value
        if (!value && !keepBackground) stopPolling()
        else if (value && client != null && monitorJob?.isActive != true) startPolling()
    }

    suspend fun connect(settings: ConnectionSettings) {
        disconnect()
        _state.update { it.copy(connection = ConnectionState(ConnectionStatus.CONNECTING, "در حال اتصال"), busy = true) }
        try {
            val t: ObdTransport = when(settings.type) {
                TransportType.BLUETOOTH_CLASSIC -> BluetoothClassicTransport(context, requireNotNull(settings.bluetoothAddress) { "دستگاه Bluetooth انتخاب نشده" })
                TransportType.WIFI_TCP -> WifiTcpTransport(settings.wifiHost, settings.wifiPort)
                TransportType.MOCK -> MockTransport()
            }
            t.connect()
            transport = t
            keepBackground = settings.keepBackground
            val c = Elm327Client(t, ::log)
            client = c
            val detected = c.initialize()
            settingsStore.saveConnection(settings)
            _state.update {
                it.copy(
                    connection = ConnectionState(ConnectionStatus.CONNECTED, "متصل", detected.protocol),
                    detection = detected,
                    busy = false,
                    logFilePath = sessionLogger.file().absolutePath,
                    logEntryCount = sessionLogger.entries()
                )
            }
            startPolling()
        } catch (t: Throwable) {
            runCatching { transport?.close() }
            transport = null
            client = null
            _state.update { it.copy(connection = ConnectionState(ConnectionStatus.ERROR, t.message ?: "خطای اتصال"), busy = false) }
        }
    }

    suspend fun disconnect() {
        stopMonitor()
        stopPolling()
        runCatching { transport?.close() }
        transport = null
        client = null
        _state.update {
            it.copy(
                connection = ConnectionState(),
                live = LiveDataSnapshot(),
                detection = null,
                polling = false,
                busy = false,
                monitorActive = false
            )
        }
    }

    suspend fun autoDetect() {
        val c = client ?: return
        _state.update { it.copy(busy = true) }
        runCatching { c.initialize() }
            .onSuccess { d -> _state.update { it.copy(detection = d, busy = false) } }
            .onFailure { e -> _state.update { it.copy(busy = false, connection = it.connection.copy(message = e.message ?: "خطا")) } }
    }

    suspend fun initializeProfile(profileCommands: List<String>): Result<DetectionResult> {
        val c = client ?: return Result.failure(IllegalStateException("اتصال برقرار نیست"))
        if (monitorJob?.isActive == true) return Result.failure(IllegalStateException("ابتدا شنود Bus را متوقف کن"))
        val wasPolling = pollingJob?.isActive == true
        stopPolling()
        _state.update { it.copy(busy = true) }
        return runCatching { c.initialize(profileCommands) }
            .onSuccess { result ->
                _state.update {
                    it.copy(
                        detection = result,
                        busy = false,
                        consoleLog = (it.consoleLog + "✓ راه‌اندازی پروفایل کامل شد: ${result.protocol ?: "نامشخص"}").takeLast(500)
                    )
                }
            }
            .onFailure { error ->
                _state.update {
                    it.copy(
                        busy = false,
                        consoleLog = (it.consoleLog + "! خطای راه‌اندازی: ${error.message}").takeLast(500)
                    )
                }
            }
            .also { if (wasPolling && client != null) startPolling() }
    }

    suspend fun sendConsoleCommand(command: String, extendedRead: Boolean): Result<String> {
        val normalized = CommandGuard.normalize(command)
        if (!CommandGuard.isAllowed(normalized, extendedRead)) {
            return Result.failure(SecurityException("فرمان $normalized در حالت Read-only مسدود است"))
        }
        val c = client ?: return Result.failure(IllegalStateException("اتصال برقرار نیست"))
        if (monitorJob?.isActive == true) return Result.failure(IllegalStateException("ابتدا شنود Bus را متوقف کن"))
        val wasPolling = pollingJob?.isActive == true
        stopPolling()
        _state.update { it.copy(busy = true, consoleLog = (it.consoleLog + "> $normalized").takeLast(500)) }
        return runCatching { c.command(normalized, 10_000) }
            .onSuccess { response ->
                val clean = response.replace(">", "").trim()
                _state.update { it.copy(busy = false, consoleLog = (it.consoleLog + clean).takeLast(500)) }
            }
            .onFailure { error ->
                _state.update { it.copy(busy = false, consoleLog = (it.consoleLog + "! ${error.message}").takeLast(500)) }
            }
            .also { if (wasPolling && client != null) startPolling() }
    }

    fun startMonitor(command: String = "ATMA") {
        if (monitorJob?.isActive == true) return
        val c = client ?: run {
            _state.update { it.copy(consoleLog = (it.consoleLog + "! اتصال برقرار نیست").takeLast(500)) }
            return
        }
        stopPolling()
        _state.update { it.copy(monitorActive = true, monitorLog = emptyList(), busy = false) }
        monitorJob = scope.launch {
            val lineBuffer = StringBuilder()
            try {
                c.monitor(command) { chunk ->
                    chunk.forEach { ch ->
                        if (ch == '\r' || ch == '\n' || ch == '>') {
                            val line = lineBuffer.toString().trim()
                            if (line.isNotBlank()) {
                                _state.update { state -> state.copy(monitorLog = (state.monitorLog + line).takeLast(5_000)) }
                            }
                            lineBuffer.clear()
                        } else lineBuffer.append(ch)
                    }
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Throwable) {
                _state.update { it.copy(consoleLog = (it.consoleLog + "! خطای شنود: ${error.message}").takeLast(500)) }
            } finally {
                _state.update { it.copy(monitorActive = false) }
                if (client != null && uiVisible) startPolling()
            }
        }
    }

    fun stopMonitor() {
        monitorJob?.cancel()
        monitorJob = null
        _state.update { it.copy(monitorActive = false) }
    }

    fun clearConsoleView() = _state.update { it.copy(consoleLog = emptyList()) }
    fun clearMonitorView() = _state.update { it.copy(monitorLog = emptyList()) }
    fun newLogSession() {
        val file = sessionLogger.newSession()
        _state.update { it.copy(logFilePath = file.absolutePath, logEntryCount = sessionLogger.entries()) }
    }
    fun currentLogFile() = sessionLogger.file()

    suspend fun readDtcs() {
        val c = client ?: return
        _state.update { it.copy(busy = true) }
        runCatching { c.readDtcs() }
            .onSuccess { list ->
                history.add("read_dtc", list.joinToString { it.code })
                _state.update { it.copy(dtcs = list, busy = false) }
            }
            .onFailure { _state.update { it.copy(busy = false) } }
    }

    suspend fun clearDtcs(engineOff: Boolean, phrase: String): ClearDtcResult {
        val c = client ?: return ClearDtcResult(false,"اتصال برقرار نیست")
        _state.update { it.copy(busy = true) }
        val result = runCatching { c.clearGenericDtcs(engineOff, phrase, _state.value.live.rpm) }
            .getOrElse { ClearDtcResult(false,it.message ?: "خطا") }
        history.add("clear_dtc", "${result.success}:${result.message}")
        if (result.success) runCatching { c.readDtcs() }.onSuccess { list -> _state.update { it.copy(dtcs = list) } }
        _state.update { it.copy(busy = false) }
        return result
    }

    fun selectVehicle(index: Int) {
        settingsStore.saveVehicle(index)
        _state.update { it.copy(vehicle = catalog.get(index)) }
    }

    fun startPolling() {
        if (pollingJob?.isActive == true || client == null || monitorJob?.isActive == true) return
        _state.update { it.copy(polling = true) }
        pollingJob = scope.launch {
            var nextRpm = 0L
            var nextSpeed = 0L
            var nextSlow = 0L
            var nextVoltage = 0L
            while(isActive) {
                if (!uiVisible && !keepBackground) { delay(2_000); continue }
                val now = System.currentTimeMillis()
                val c = client ?: break
                var sleep = 2_000L
                if(now >= nextRpm) {
                    runCatching { ObdParsers.parseRpm(c.command("010C")) }.getOrNull()?.let { value ->
                        _state.update { it.copy(live = it.live.copy(rpm = value, updatedAt = now)) }
                    }
                    nextRpm = now + 350
                    sleep = minOf(sleep, 350)
                }
                if(now >= nextSpeed) {
                    runCatching { ObdParsers.parseSpeed(c.command("010D")) }.getOrNull()?.let { value ->
                        _state.update { it.copy(live = it.live.copy(speedKph = value, updatedAt = now)) }
                    }
                    nextSpeed = now + 450
                    sleep = minOf(sleep, 450)
                }
                if(now >= nextSlow) {
                    val coolant = runCatching { ObdParsers.parseCoolant(c.command("0105")) }.getOrNull()
                    val load = runCatching { ObdParsers.parseLoad(c.command("0104")) }.getOrNull()
                    _state.update { it.copy(live = it.live.copy(coolantC = coolant ?: it.live.coolantC, engineLoad = load ?: it.live.engineLoad, updatedAt = now)) }
                    nextSlow = now + 2_000
                }
                if(now >= nextVoltage) {
                    val voltage = runCatching { ObdParsers.parseVoltage(c.command("ATRV")) }.getOrNull()
                    if(voltage != null) _state.update { it.copy(live = it.live.copy(voltage = voltage, updatedAt = now)) }
                    nextVoltage = now + 5_000
                }
                delay(max(60, minOf(sleep, nextRpm-now, nextSpeed-now, nextSlow-now, nextVoltage-now)))
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
        _state.update { it.copy(polling = false) }
    }
}
