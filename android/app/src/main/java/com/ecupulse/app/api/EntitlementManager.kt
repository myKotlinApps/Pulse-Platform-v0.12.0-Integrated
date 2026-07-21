package com.ecupulse.app.api

import com.ecupulse.app.model.EntitlementState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class EntitlementManager(private val api: AnalysisApiClient) {
    private val _state = MutableStateFlow(EntitlementState())
    val state: StateFlow<EntitlementState> = _state.asStateFlow()
    suspend fun refresh(): EntitlementState = api.entitlement().also { _state.value=it }
    suspend fun authorizeClear(): String = api.authorizeDtcClear()
    suspend fun completeClear(token:String,success:Boolean){api.completeDtcClear(token,success);runCatching{refresh()}}
}
