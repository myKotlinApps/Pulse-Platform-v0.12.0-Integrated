package com.ecupulse.app.model

enum class TransportType { BLUETOOTH_CLASSIC, WIFI_TCP, MOCK }
enum class ConnectionStatus { DISCONNECTED, CONNECTING, CONNECTED, DEGRADED, ERROR }
enum class DtcKind { STORED, PENDING, PERMANENT }
enum class UserPlan { FREE, PRO }
enum class AppTheme { DARK, IVORY }

data class ConnectionState(val status: ConnectionStatus = ConnectionStatus.DISCONNECTED, val message: String = "قطع", val protocol: String? = null)
data class LiveDataSnapshot(val rpm: Double? = null, val speedKph: Int? = null, val coolantC: Int? = null, val engineLoad: Double? = null, val voltage: Double? = null, val updatedAt: Long = 0, val stale: Boolean = false)
data class DtcRecord(val code: String, val kind: DtcKind, val description: String? = null)
data class DetectionResult(val adapter: String? = null, val protocol: String? = null, val protocolNumber: String? = null, val vin: String? = null, val calibrationId: String? = null, val ecuName: String? = null, val supportedPids: Set<Int> = emptySet(), val confidence: Int = 0)
data class VehicleProfile(val index: Int, val make: String, val model: String, val profile: String, val segment: String, val protocols: List<String>, val notes: String, val isDemo: Boolean = false, val logoAsset: String? = null)
data class ConnectionSettings(val type: TransportType = TransportType.BLUETOOTH_CLASSIC, val bluetoothAddress: String? = null, val wifiHost: String = "192.168.0.10", val wifiPort: Int = 35000, val keepBackground: Boolean = false)
data class ClearDtcResult(val success: Boolean, val message: String, val rawResponse: String? = null)

data class AppErrorRecord(
    val id: String,
    val code: String,
    val title: String,
    val detail: String,
    val component: String,
    val timestamp: Long,
    val recoverable: Boolean,
    val sent: Boolean = false,
    val metadata: Map<String, String> = emptyMap()
)

data class EntitlementState(
    val plan: UserPlan = UserPlan.FREE,
    val clearDtcLimit: Int = 5,
    val clearDtcUsed: Int = 0,
    val verifiedAt: Long = 0,
    val onlineVerified: Boolean = false
) { val clearDtcRemaining: Int get() = if (clearDtcLimit < 0) -1 else (clearDtcLimit - clearDtcUsed).coerceAtLeast(0) }

data class TripPoint(val latitude: Double, val longitude: Double, val timestamp: Long, val speedKph: Float, val accuracyMeters: Float, val rpm: Double? = null)
data class TripRecord(val id: String, val startedAt: Long, val endedAt: Long, val points: List<TripPoint>, val distanceMeters: Double, val movingSeconds: Long, val stoppedSeconds: Long, val maxSpeedKph: Float)

data class AnalysisAlert(val severity: String, val title: String, val detail: String)
data class AnalysisReport(val reportId: String, val generatedAt: String, val score: Int, val summary: String, val alerts: List<AnalysisAlert>)
data class StoreOffer(val id: String, val titleFa: String, val basePrice: Long, val currency: String)
data class CouponQuote(val quoteId: String, val offerId: String, val percent: Int, val basePrice: Long, val finalPrice: Long, val currency: String, val storeProductId: String?, val storeOfferId: String?, val expiresAt: Long, val signature: String)

data class MainUiState(
    val connection: ConnectionState = ConnectionState(),
    val live: LiveDataSnapshot = LiveDataSnapshot(),
    val dtcs: List<DtcRecord> = emptyList(),
    val detection: DetectionResult? = null,
    val vehicle: VehicleProfile? = null,
    val log: List<String> = emptyList(),
    val polling: Boolean = false,
    val busy: Boolean = false,
    val entitlement: EntitlementState = EntitlementState(),
    val currentError: AppErrorRecord? = null,
    val recentErrors: List<AppErrorRecord> = emptyList(),
    val analysisReport: AnalysisReport? = null,
    val consoleLog: List<String> = emptyList(),
    val monitorLog: List<String> = emptyList(),
    val monitorActive: Boolean = false,
    val logFilePath: String = "",
    val logEntryCount: Long = 0
)
