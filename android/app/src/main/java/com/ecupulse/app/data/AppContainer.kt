package com.ecupulse.app.data

import android.content.Context
import com.ecupulse.app.api.AnalysisApiClient
import com.ecupulse.app.obd.ObdSession

class AppContainer(context: Context) {
    val settings = SettingsStore(context)
    val catalog = VehicleCatalog(context)
    val history = DiagnosticHistoryStore(context)
    val analysis = AnalysisApiClient(context.applicationContext)
    val session = ObdSession(context.applicationContext, settings, catalog, history)
}
