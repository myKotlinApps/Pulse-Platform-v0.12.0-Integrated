package com.ecupulse.app

import android.app.Application
import com.ecupulse.app.data.AppContainer

class EcuPulseApplication : Application() {
    lateinit var container: AppContainer
        private set
    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        instance = this
    }
    companion object { lateinit var instance: EcuPulseApplication; private set }
}
