package com.ecupulse.app.data

import android.content.Context
import com.ecupulse.app.model.*

class SettingsStore(context: Context) {
    private val prefs = context.getSharedPreferences("ecu_pulse_settings", Context.MODE_PRIVATE)
    fun loadConnection() = ConnectionSettings(
        type = runCatching { TransportType.valueOf(prefs.getString("transport", TransportType.MOCK.name)!!) }.getOrDefault(TransportType.BLUETOOTH_CLASSIC),
        bluetoothAddress = prefs.getString("bt_address", null), wifiHost = prefs.getString("wifi_host", "192.168.0.10") ?: "192.168.0.10",
        wifiPort = prefs.getInt("wifi_port", 35000), keepBackground = prefs.getBoolean("keep_background", false)
    )
    fun saveConnection(s: ConnectionSettings) { prefs.edit().putString("transport", s.type.name).putString("bt_address", s.bluetoothAddress).putString("wifi_host", s.wifiHost).putInt("wifi_port", s.wifiPort).putBoolean("keep_background", s.keepBackground).apply() }
    fun activeVehicleIndex(): Int = prefs.getInt("vehicle_index", VehicleCatalog.DEMO_INDEX)
    fun isFirstLaunch(): Boolean = !prefs.contains("first_launch_completed")
    fun markFirstLaunchCompleted() { prefs.edit().putBoolean("first_launch_completed", true).apply() }
    fun saveVehicle(index: Int) { prefs.edit().putInt("vehicle_index", index).apply() }
    fun isDevelopmentProUnlocked(): Boolean = prefs.getBoolean("dev_pro_unlocked", false)
    fun setDevelopmentProUnlocked(value: Boolean) { prefs.edit().putBoolean("dev_pro_unlocked", value).apply() }
    fun themeId(): String = prefs.getString("theme_id", "mydiag") ?: "mydiag"
    fun saveThemeId(value: String) { prefs.edit().putString("theme_id", value).apply() }
}
