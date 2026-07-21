package com.ecupulse.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.ecupulse.app.data.AppContainer
import com.ecupulse.app.model.ConnectionSettings
import kotlinx.coroutines.launch

class MainViewModel(private val container: AppContainer) : ViewModel() {
    val state = container.session.state
    val catalog = container.catalog
    val savedConnection get() = container.settings.loadConnection()
    val shouldAutoStartDemo get() = state.value.vehicle?.isDemo == true
    val isDevelopmentProUnlocked get() = container.settings.isDevelopmentProUnlocked()
    fun connect(settings: ConnectionSettings) = viewModelScope.launch { container.session.connect(settings) }
    fun startDemo() = viewModelScope.launch { container.settings.markFirstLaunchCompleted(); container.session.connect(ConnectionSettings(type = com.ecupulse.app.model.TransportType.MOCK)) }
    fun disconnect() = viewModelScope.launch { container.session.disconnect() }
    fun autoDetect() = viewModelScope.launch { container.session.autoDetect() }
    fun readDtcs() = viewModelScope.launch { container.session.readDtcs() }
    fun clearDtcs(engineOff: Boolean, phrase: String, callback: (String)->Unit) = viewModelScope.launch { callback(container.session.clearDtcs(engineOff, phrase).message) }
    fun selectVehicle(index: Int) = container.session.selectVehicle(index)
    fun sendConsoleCommand(command: String, extendedRead: Boolean, callback: (Result<String>) -> Unit = {}) = viewModelScope.launch { callback(container.session.sendConsoleCommand(command, extendedRead)) }
    fun initializeProfile(commands: List<String>, callback: (Result<com.ecupulse.app.model.DetectionResult>) -> Unit = {}) = viewModelScope.launch { callback(container.session.initializeProfile(commands)) }
    fun startMonitor(command: String) = container.session.startMonitor(command)
    fun stopMonitor() = container.session.stopMonitor()
    fun clearConsoleView() = container.session.clearConsoleView()
    fun clearMonitorView() = container.session.clearMonitorView()
    fun newLogSession() = container.session.newLogSession()
    fun currentLogFile() = container.session.currentLogFile()
    fun setUiVisible(v:Boolean)=container.session.setUiVisible(v)
    fun unlockDevelopmentPro(code: String): Boolean {
        if (!com.ecupulse.app.BuildConfig.ALLOW_DEV_AUTH || code.trim() != "1234") return false
        container.settings.setDevelopmentProUnlocked(true)
        container.analysis.invalidateToken()
        return true
    }
    fun disableDevelopmentPro() { container.settings.setDevelopmentProUnlocked(false); container.analysis.invalidateToken() }
    class Factory(private val c: AppContainer): ViewModelProvider.Factory { override fun <T:ViewModel> create(modelClass:Class<T>):T { @Suppress("UNCHECKED_CAST") return MainViewModel(c) as T } }
}
