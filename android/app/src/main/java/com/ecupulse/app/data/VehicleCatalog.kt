package com.ecupulse.app.data

import android.content.Context
import com.ecupulse.app.model.VehicleProfile
import org.json.JSONObject

class VehicleCatalog(private val context: Context) {
    companion object { const val DEMO_INDEX = -100 }

    val demo: VehicleProfile by lazy {
        val root = JSONObject(context.assets.open("data/demo-profile.json").bufferedReader().use { it.readText() })
        parseVehicle(root.getJSONObject("vehicle"), DEMO_INDEX)
    }

    val vehicles: List<VehicleProfile> by lazy {
        val text = context.assets.open("data/core-data.json").bufferedReader().use { it.readText() }
        val array = JSONObject(text).getJSONArray("vehicles")
        buildList {
            add(demo)
            for (i in 0 until array.length()) add(parseVehicle(array.getJSONObject(i), i))
        }
    }

    private fun parseVehicle(o: JSONObject, fallbackIndex: Int): VehicleProfile {
        val protocols = o.optJSONArray("protocols")
        return VehicleProfile(
            index = o.optInt("index", fallbackIndex),
            make = o.optString("make"), model = o.optString("model"), profile = o.optString("profile"),
            segment = o.optString("segment"),
            protocols = buildList { if (protocols != null) for (j in 0 until protocols.length()) add(protocols.optString(j)) },
            notes = o.optString("notes"), isDemo = o.optBoolean("isDemo", false),
            logoAsset = o.optString("logoAsset").ifBlank { null }
        )
    }

    fun makes(): List<String> = vehicles.map { it.make }.distinct().sorted()
    fun models(make: String): List<VehicleProfile> = vehicles.filter { it.make == make }.sortedBy { it.model }
    fun get(index: Int): VehicleProfile? = vehicles.firstOrNull { it.index == index }
}
