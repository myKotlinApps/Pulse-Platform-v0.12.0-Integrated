package com.ecupulse.app

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.graphics.Typeface
import android.content.res.ColorStateList
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import coil3.load
import com.ecupulse.app.databinding.ActivityMainBinding
import com.ecupulse.app.model.AnalysisAlert
import com.ecupulse.app.model.AnalysisReport
import com.ecupulse.app.model.ConnectionSettings
import com.ecupulse.app.model.ConnectionStatus
import com.ecupulse.app.model.DtcKind
import com.ecupulse.app.model.DtcRecord
import com.ecupulse.app.model.MainUiState
import com.ecupulse.app.model.TransportType
import com.ecupulse.app.model.VehicleProfile
import com.ecupulse.app.platform.PlatformPolicy
import com.ecupulse.app.service.ObdConnectionService
import com.ecupulse.app.trip.TripTrackingService
import com.ecupulse.app.ui.BrandLogoResolver
import com.ecupulse.app.ui.FontInstaller
import com.ecupulse.app.ui.theme.EpsDashboardTheme
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val container get() = (application as EcuPulseApplication).container
    private val viewModel: MainViewModel by viewModels { MainViewModel.Factory(container) }

    private var bluetoothItems: List<Pair<String, String>> = emptyList()
    private var currentModels: List<VehicleProfile> = emptyList()
    private var pendingConnect: ConnectionSettings? = null
    private var lastAnalysisReport: AnalysisReport? = null
    private var scannerProfiles: List<Pair<String, List<String>>> = emptyList()

    private val connectionPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        if (result.values.all { it }) pendingConnect?.let(::beginConnect)
        else toast("مجوز اتصال داده نشد")
    }

    private val tripPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        if (result.values.all { it }) beginTripTracking()
        else toast("مجوز موقعیت مکانی داده نشد")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        FontInstaller.apply(binding.root)

        setupNavigation()
        setupMyDiagHome()
        setupDashboard()
        setupTripDemo()
        setupDtc()
        setupVehicle()
        setupProAccess()
        setupAnalysis()
        setupConnection()
        setupScanner()
        setupThemeSelector()
        collectState()
        showPage(R.id.nav_home)
        if (viewModel.shouldAutoStartDemo) viewModel.startDemo()
    }

    override fun onStart() {
        super.onStart()
        viewModel.setUiVisible(true)
    }

    override fun onStop() {
        viewModel.setUiVisible(false)
        super.onStop()
    }

    private fun setupNavigation() {
        binding.bottomNav.setOnItemSelectedListener {
            showPage(it.itemId)
            true
        }
    }

    private fun hideAllPages() {
        listOf(
            binding.mydiagHomeScreen.root,
            binding.dashboardScreen.root,
            binding.dtcScreen.root,
            binding.vehicleScreen.root,
            binding.proCenterScreen.root,
            binding.tripScreen.root,
            binding.analysisScreen.root,
            binding.settingsScreen.root,
            binding.scannerScreen.root
        ).forEach { it.visibility = View.GONE }
    }

    private fun showPage(id: Int) {
        hideAllPages()
        when (id) {
            R.id.nav_home -> {
                binding.mydiagHomeScreen.root.visibility = View.VISIBLE
                title("SMART VEHICLE", "خانه خودرو")
            }
            R.id.nav_dashboard -> {
                binding.dashboardScreen.root.visibility = View.VISIBLE
                title("LIVE DATA", "داشبورد")
            }
            R.id.nav_dtc -> {
                binding.dtcScreen.root.visibility = View.VISIBLE
                title("DIAGNOSTICS", "خطاهای ECU")
            }
            R.id.nav_vehicle -> {
                binding.vehicleScreen.root.visibility = View.VISIBLE
                title("AUTO DETECT", "خودرو")
            }
            R.id.nav_pro -> {
                binding.proCenterScreen.root.visibility = View.VISIBLE
                title("ADVANCED CENTER", "نسخه پیشرفته")
            }
            else -> {
                binding.settingsScreen.root.visibility = View.VISIBLE
                title("ELM327", "اتصال")
            }
        }
    }

    private fun title(eyebrow: String, title: String) {
        binding.headerEyebrow.text = eyebrow
        binding.headerTitle.text = title
    }


    private fun setupMyDiagHome() {
        with(binding.mydiagHomeScreen) {
            menuDashboard.setOnClickListener { showPage(R.id.nav_dashboard) }
            menuDiagnosis.setOnClickListener { showPage(R.id.nav_dtc) }
            menuDrivingRecord.setOnClickListener { showTripDemo() }
            menuDrivingStyle.setOnClickListener {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("سبک رانندگی")
                    .setMessage("امتیاز آموزشی رانندگی: ۹۲ از ۱۰۰\nشتاب ناگهانی: ۲\nترمز شدید: ۱\nتوقف طولانی: ۳")
                    .setPositiveButton("باشه", null)
                    .show()
            }
            menuVehicleManagement.setOnClickListener { showPage(R.id.nav_vehicle) }
            menuParking.setOnClickListener {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("محل پارک")
                    .setMessage("برای ذخیره و مشاهده محل پارک، از صفحه سفرها و ثبت GPS استفاده کن.")
                    .setPositiveButton("بازکردن سفرها") { _, _ -> showTripDemo() }
                    .setNegativeButton("بستن", null)
                    .show()
            }
            menuDashcam.setOnClickListener {
                toast("نمایش فایل ویدئویی محلی در نسخه وب فعال است؛ انتخاب فایل Android در مرحله بعد افزوده می‌شود.")
            }
            menuMall.setOnClickListener { showPage(R.id.nav_pro) }
            menuScanner.setOnClickListener { showScannerScreen() }
            menuPro.setOnClickListener { showPage(R.id.nav_pro) }
            menuRegisterVehicle.setOnClickListener { showPage(R.id.nav_vehicle) }
            menuSettings.setOnClickListener { showPage(R.id.nav_settings) }
            menuPurchase.setOnClickListener { showPage(R.id.nav_pro) }
        }
    }

    private fun setupDashboard() {
        binding.dashboardScreen.speedGauge.configure(220f, "km/h")
        binding.dashboardScreen.rpmGauge.configure(7000f, "rpm")
        binding.dashboardScreen.readLiveButton.setOnClickListener {
            if (viewModel.state.value.polling) container.session.stopPolling()
            else container.session.startPolling()
        }
        binding.dashboardScreen.demoResetButton.setOnClickListener {
            viewModel.selectVehicle(com.ecupulse.app.data.VehicleCatalog.DEMO_INDEX)
            viewModel.startDemo()
            toast("پروفایل نمایشی اجرا شد")
        }
        binding.dashboardScreen.demoTripButton.setOnClickListener { showTripDemo() }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupTripDemo() {
        with(binding.tripScreen.tripWebView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
        }
        binding.tripScreen.tripWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                val raw = assets.open("data/demo-profile.json").bufferedReader().use { it.readText() }
                val demo = org.json.JSONObject(raw).getJSONObject("demoTrip").toString()
                view?.evaluateJavascript("renderTrip($demo)", null)
            }
        }
        binding.tripScreen.backButton.setOnClickListener { showPage(R.id.nav_dashboard) }
        binding.tripScreen.startTrackingButton.setOnClickListener { requestTripTracking() }
        binding.tripScreen.stopTrackingButton.setOnClickListener {
            startService(
                Intent(this, TripTrackingService::class.java)
                    .setAction(TripTrackingService.ACTION_STOP)
            )
            binding.tripScreen.startTrackingButton.isEnabled = true
            binding.tripScreen.stopTrackingButton.isEnabled = false
            binding.tripScreen.tripWebView.postDelayed({ loadLastRecordedTrip() }, 800)
        }
    }

    private fun showTripDemo() {
        hideAllPages()
        binding.tripScreen.root.visibility = View.VISIBLE
        title("TRIP REPLAY", "مسیر و تاریخچه سفر")
        binding.tripScreen.tripWebView.loadUrl("file:///android_asset/trip-map.html")
    }

    private fun requestTripTracking() {
        val missing = listOf(Manifest.permission.ACCESS_FINE_LOCATION).filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) beginTripTracking()
        else tripPermissionLauncher.launch(missing.toTypedArray())
    }

    private fun beginTripTracking() {
        ContextCompat.startForegroundService(
            this,
            Intent(this, TripTrackingService::class.java).setAction(TripTrackingService.ACTION_START)
        )
        binding.tripScreen.startTrackingButton.isEnabled = false
        binding.tripScreen.stopTrackingButton.isEnabled = true
        toast("ثبت سفر شروع شد")
    }

    private fun loadLastRecordedTrip() {
        val raw = getSharedPreferences("trip_tracking", MODE_PRIVATE)
            .getString("last_trip", null)
            ?: return toast("نقطه کافی برای سفر ثبت نشد")
        binding.tripScreen.tripWebView.evaluateJavascript("renderRecordedTrip($raw)", null)
        toast("مسیر ثبت‌شده نمایش داده شد")
    }

    private fun setupDtc() {
        binding.dtcScreen.readDtcButton.setOnClickListener { viewModel.readDtcs() }
        binding.dtcScreen.clearDtcButton.setOnClickListener { showClearDialog() }
    }

    private fun setupVehicle() {
        val makes = viewModel.catalog.makes()
        binding.vehicleScreen.brandSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            makes
        )
        binding.vehicleScreen.brandSpinner.onItemSelectedListener =
            object : AdapterView.OnItemSelectedListener {
                override fun onNothingSelected(parent: AdapterView<*>?) = Unit
                override fun onItemSelected(
                    parent: AdapterView<*>?,
                    view: View?,
                    position: Int,
                    id: Long
                ) {
                    currentModels = viewModel.catalog.models(makes[position])
                    binding.vehicleScreen.modelSpinner.adapter = ArrayAdapter(
                        this@MainActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        currentModels.map { it.model }
                    )
                    currentModels.firstOrNull()?.let {
                        loadLogo(binding.vehicleScreen.selectedLogo, it)
                    }
                }
            }
        binding.vehicleScreen.modelSpinner.onItemSelectedListener =
            object : AdapterView.OnItemSelectedListener {
                override fun onNothingSelected(parent: AdapterView<*>?) = Unit
                override fun onItemSelected(
                    parent: AdapterView<*>?,
                    view: View?,
                    position: Int,
                    id: Long
                ) {
                    currentModels.getOrNull(position)?.let {
                        loadLogo(binding.vehicleScreen.selectedLogo, it)
                    }
                }
            }
        binding.vehicleScreen.saveVehicleButton.setOnClickListener {
            val vehicle = currentModels.getOrNull(
                binding.vehicleScreen.modelSpinner.selectedItemPosition
            ) ?: return@setOnClickListener
            viewModel.selectVehicle(vehicle.index)
            if (vehicle.isDemo) viewModel.startDemo() else viewModel.disconnect()
            toast("پروفایل ${vehicle.make} ${vehicle.model} فعال شد")
        }
        binding.vehicleScreen.autoDetectButton.setOnClickListener { viewModel.autoDetect() }
    }

    private fun setupProAccess() {
        binding.proCenterScreen.unlockProButton.setOnClickListener {
            val ok = viewModel.unlockDevelopmentPro(
                binding.proCenterScreen.proCodeInput.text.toString()
            )
            if (ok) {
                binding.proCenterScreen.proCodeInput.text?.clear()
                toast("نسخه پیشرفته آزمایشی فعال شد")
            } else toast("کد فعال‌سازی نادرست است")
            renderProAccess()
        }
        binding.proCenterScreen.disableProButton.setOnClickListener {
            viewModel.disableDevelopmentPro()
            renderProAccess()
            toast("نسخه رایگان فعال شد")
        }
        binding.proCenterScreen.analysisFeatureButton.setOnClickListener {
            if (requirePro()) showAnalysisScreen()
        }
        binding.proCenterScreen.tripFeatureButton.setOnClickListener {
            if (requirePro()) showTripDemo()
        }
        binding.proCenterScreen.vehicleFeatureButton.setOnClickListener {
            if (requirePro()) showPage(R.id.nav_vehicle)
        }
        binding.proCenterScreen.liveFeatureButton.setOnClickListener {
            if (requirePro()) showPage(R.id.nav_dashboard)
        }
        binding.proCenterScreen.dtcFeatureButton.setOnClickListener {
            if (requirePro()) showPage(R.id.nav_dtc)
        }
        binding.proCenterScreen.pdfFeatureButton.setOnClickListener {
            if (!requirePro()) return@setOnClickListener
            showAnalysisScreen()
            if (lastAnalysisReport == null) runAnalysis() else saveAnalysisPdf()
        }
        renderProAccess()
    }

    private fun requirePro(): Boolean {
        if (viewModel.isDevelopmentProUnlocked) return true
        toast("ابتدا نسخه پیشرفته را با کد ۱۲۳۴ فعال کن")
        return false
    }

    private fun renderProAccess() {
        val pro = viewModel.isDevelopmentProUnlocked
        binding.proCenterScreen.proStatusText.text =
            if (pro) "نسخه پیشرفته آزمایشی فعال است" else "نسخه رایگان فعال است"
        binding.proCenterScreen.proStatusText.setTextColor(
            ContextCompat.getColor(this, if (pro) R.color.green else R.color.orange)
        )
        binding.proCenterScreen.unlockProButton.visibility = if (pro) View.GONE else View.VISIBLE
        binding.proCenterScreen.proCodeInput.visibility = if (pro) View.GONE else View.VISIBLE
        binding.proCenterScreen.disableProButton.visibility = if (pro) View.VISIBLE else View.GONE
        binding.proCenterScreen.proFeatures.alpha = if (pro) 1f else .45f
        for (i in 0 until binding.proCenterScreen.proFeatures.childCount) {
            binding.proCenterScreen.proFeatures.getChildAt(i).isEnabled = pro
        }
    }

    private fun setupAnalysis() {
        binding.analysisScreen.backButton.setOnClickListener { showPage(R.id.nav_pro) }
        binding.analysisScreen.analyzeButton.setOnClickListener { runAnalysis() }
        binding.analysisScreen.pdfButton.setOnClickListener { saveAnalysisPdf() }
    }

    private fun showAnalysisScreen() {
        hideAllPages()
        binding.analysisScreen.root.visibility = View.VISIBLE
        title("DIAGEMAN API", "تحلیل ماشین من")
    }

    private fun runAnalysis() {
        if (!requirePro()) return
        binding.analysisScreen.reportText.text = "در حال تحلیل…"
        binding.analysisScreen.sourceText.text = "در حال اتصال به سرور…"
        lifecycleScope.launch {
            val state = viewModel.state.value
            val serverResult = runCatching {
                container.analysis.analyze(state.vehicle, state.live, state.dtcs)
            }
            val report = serverResult.getOrElse {
                binding.analysisScreen.sourceText.text =
                    "سرور در دسترس نبود؛ تحلیل محلی آزمایشی نمایش داده شد."
                localAnalysis(state)
            }
            if (serverResult.isSuccess) {
                binding.analysisScreen.sourceText.text = "تحلیل از سرور Diageman دریافت شد."
            }
            lastAnalysisReport = report
            binding.analysisScreen.reportText.text = buildString {
                append("امتیاز سلامت: ${report.score}/100\n\n${report.summary}")
                report.alerts.forEach { alert ->
                    append("\n\n• ${alert.title}\n${alert.detail}")
                }
            }
            binding.analysisScreen.pdfButton.isEnabled = true
        }
    }

    private fun localAnalysis(state: MainUiState): AnalysisReport {
        val alerts = mutableListOf<AnalysisAlert>()
        var score = 94
        state.dtcs.forEach {
            score -= if (it.kind == DtcKind.PERMANENT) 14 else 9
            alerts += AnalysisAlert(
                "medium",
                "کد ${it.code}",
                it.description ?: "این کد نیازمند بررسی مرحله‌ای است."
            )
        }
        if ((state.live.coolantC ?: 0) > 105) {
            score -= 18
            alerts += AnalysisAlert("high", "دمای موتور بالا", "سیستم خنک‌کاری بررسی شود.")
        }
        return AnalysisReport(
            "local-${System.currentTimeMillis()}",
            SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date()),
            score.coerceAtLeast(0),
            if (alerts.isEmpty()) "هشدار مهمی مشاهده نشد." else "مواردی برای بررسی پیدا شد.",
            alerts
        )
    }

    private fun saveAnalysisPdf() {
        val report = lastAnalysisReport ?: return toast("ابتدا تحلیل را اجرا کن")
        lifecycleScope.launch {
            val bytes = runCatching { container.analysis.pdf(report) }
                .getOrElse { simplePdf(report) }
            val dir = getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS) ?: filesDir
            val file = File(dir, "ecu-pulse-${report.reportId}.pdf")
            runCatching { file.writeBytes(bytes) }
                .onSuccess { toast("PDF ذخیره شد: ${file.absolutePath}") }
                .onFailure { toast("ذخیره PDF ناموفق بود: ${it.message}") }
        }
    }

    private fun simplePdf(report: AnalysisReport): ByteArray {
        val safeText = "ECU Pulse | Score ${report.score}/100 | ${report.summary}"
            .replace("(", "[")
            .replace(")", "]")
        val stream = "BT /F1 14 Tf 45 790 Td ($safeText) Tj ET"
        val objects = listOf(
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
            "<< /Length ${stream.toByteArray().size} >>\nstream\n$stream\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        )
        val output = StringBuilder("%PDF-1.4\n")
        val offsets = mutableListOf<Int>()
        objects.forEachIndexed { index, obj ->
            offsets += output.toString().toByteArray().size
            output.append("${index + 1} 0 obj\n$obj\nendobj\n")
        }
        val xref = output.toString().toByteArray().size
        output.append("xref\n0 ${objects.size + 1}\n0000000000 65535 f \n")
        offsets.forEach { output.append(String.format(Locale.US, "%010d 00000 n \n", it)) }
        output.append("trailer << /Size ${objects.size + 1} /Root 1 0 R >>\n")
        output.append("startxref\n$xref\n%%EOF")
        return output.toString().toByteArray()
    }


    private fun showScannerScreen() {
        hideAllPages()
        binding.scannerScreen.root.visibility = View.VISIBLE
        title("ELM327 COMMAND CENTER", "اسکنر و کنسول ECU")
    }

    private fun setupScanner() {
        fun showPanel(target: View) {
            listOf(
                binding.scannerScreen.scannerConnectionPanel,
                binding.scannerScreen.scannerConsolePanel,
                binding.scannerScreen.scannerMonitorPanel,
                binding.scannerScreen.scannerLogsPanel
            ).forEach { it.visibility = if (it === target) View.VISIBLE else View.GONE }
        }
        binding.scannerScreen.tabConnection.setOnClickListener { showPanel(binding.scannerScreen.scannerConnectionPanel) }
        binding.scannerScreen.tabConsole.setOnClickListener { showPanel(binding.scannerScreen.scannerConsolePanel) }
        binding.scannerScreen.tabMonitor.setOnClickListener { showPanel(binding.scannerScreen.scannerMonitorPanel) }
        binding.scannerScreen.tabLogs.setOnClickListener { showPanel(binding.scannerScreen.scannerLogsPanel) }
        binding.scannerScreen.openConnectionSettings.setOnClickListener { showPage(R.id.nav_settings) }

        val profileRoot = org.json.JSONObject(assets.open("data/elm327-protocol-profiles.json").bufferedReader().use { it.readText() })
        val profileArray = profileRoot.getJSONArray("profiles")
        scannerProfiles = (0 until profileArray.length()).map { index ->
            val item = profileArray.getJSONObject(index)
            val commands = item.getJSONArray("commands")
            item.getString("nameFa") to (0 until commands.length()).map { commandIndex -> commands.getString(commandIndex) }
        }
        binding.scannerScreen.protocolProfileSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            scannerProfiles.mapIndexed { index, profile -> "${index + 1}. ${profile.first}" }
        )
        binding.scannerScreen.runProfileInit.setOnClickListener {
            val commands = scannerProfiles.getOrNull(binding.scannerScreen.protocolProfileSpinner.selectedItemPosition)?.second ?: listOf("ATSP0")
            binding.scannerScreen.profileResult.text = "در حال اجرای ${commands.joinToString()}…"
            viewModel.initializeProfile(commands) { result ->
                runOnUiThread {
                    binding.scannerScreen.profileResult.text = result.fold(
                        onSuccess = { "Protocol: ${it.protocol ?: "--"}\nAdapter: ${it.adapter ?: "--"}\nVIN: ${it.vin ?: "--"}" },
                        onFailure = { "ERROR: ${it.message}" }
                    )
                }
            }
        }

        fun sendCommand(command: String) {
            if (command.isBlank()) return
            viewModel.sendConsoleCommand(command, binding.scannerScreen.extendedReadCheck.isChecked) { result ->
                result.exceptionOrNull()?.let { runOnUiThread { toast(it.message ?: "خطای فرمان") } }
            }
            binding.scannerScreen.consoleCommand.text?.clear()
        }
        binding.scannerScreen.sendConsoleCommand.setOnClickListener {
            sendCommand(binding.scannerScreen.consoleCommand.text.toString())
        }
        binding.scannerScreen.consoleCommand.setOnEditorActionListener { _, _, _ ->
            sendCommand(binding.scannerScreen.consoleCommand.text.toString())
            true
        }
        binding.scannerScreen.clearConsoleOutput.setOnClickListener { viewModel.clearConsoleView() }

        val commandRoot = org.json.JSONObject(assets.open("data/ecu-console-commands.json").bufferedReader().use { it.readText() })
        val groups = commandRoot.getJSONArray("groups")
        binding.scannerScreen.quickCommandsContainer.removeAllViews()
        for (groupIndex in 0 until groups.length()) {
            val group = groups.getJSONObject(groupIndex)
            binding.scannerScreen.quickCommandsContainer.addView(TextView(this).apply {
                text = group.getString("titleFa")
                setTextColor(ContextCompat.getColor(context, R.color.text))
                setTypeface(typeface, Typeface.BOLD)
                setPadding(0, 18, 0, 6)
            })
            val commands = group.getJSONArray("commands")
            for (commandIndex in 0 until commands.length()) {
                val item = commands.getJSONObject(commandIndex)
                val command = item.getString("command")
                binding.scannerScreen.quickCommandsContainer.addView(android.widget.Button(this).apply {
                    text = "${item.getString("labelFa")}  ·  $command"
                    isAllCaps = false
                    setOnClickListener { sendCommand(command) }
                })
            }
        }

        binding.scannerScreen.applyMonitorFilter.setOnClickListener {
            val filter = binding.scannerScreen.monitorFilter.text.toString().uppercase().replace(Regex("\\s+"), "")
            val command = if (filter.isBlank()) "ATCRA" else "ATCRA$filter"
            viewModel.sendConsoleCommand(command, false) { result ->
                result.exceptionOrNull()?.let { runOnUiThread { toast(it.message ?: "خطای فیلتر") } }
            }
        }
        binding.scannerScreen.startMonitor.setOnClickListener { viewModel.startMonitor("ATMA") }
        binding.scannerScreen.stopMonitor.setOnClickListener { viewModel.stopMonitor() }
        binding.scannerScreen.clearMonitorOutput.setOnClickListener { viewModel.clearMonitorView() }
        binding.scannerScreen.newLogSession.setOnClickListener {
            viewModel.newLogSession()
            toast("فایل لاگ جدید ساخته شد")
        }
        binding.scannerScreen.shareLogFile.setOnClickListener { shareCurrentLog() }
    }

    private fun shareCurrentLog() {
        val file = viewModel.currentLogFile()
        if (!file.exists()) return toast("فایل لاگ پیدا نشد")
        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
        startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply {
            type = "application/x-ndjson"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }, "اشتراک فایل لاگ ECU"))
    }

    private fun setupThemeSelector() {
        val themes = EpsDashboardTheme.all
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            themes.map { it.titleFa }
        )
        binding.settingsScreen.themeSpinner.adapter = adapter
        val savedId = container.settings.themeId()
        val initial = themes.indexOfFirst { it.id == savedId }.coerceAtLeast(0)
        binding.settingsScreen.themeSpinner.setSelection(initial, false)
        applyEpsTheme(themes[initial], persist = false)
        binding.settingsScreen.themeSpinner.onItemSelectedListener =
            object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: View?, position: Int, id: Long) {
                    applyEpsTheme(themes[position], persist = true)
                }
                override fun onNothingSelected(parent: android.widget.AdapterView<*>?) = Unit
            }
    }

    private fun applyEpsTheme(theme: EpsDashboardTheme, persist: Boolean) {
        if (persist) container.settings.saveThemeId(theme.id)
        binding.root.setBackgroundColor(theme.background)
        binding.content.setBackgroundColor(theme.background)
        binding.dashboardScreen.root.setBackgroundColor(theme.background)
        binding.dashboardScreen.epsThemePanel.setTheme(theme.id)
        binding.headerEyebrow.setTextColor(theme.accent)
        binding.headerTitle.setTextColor(theme.text)
        binding.bottomNav.backgroundTintList = ColorStateList.valueOf(theme.panel)
        binding.bottomNav.itemIconTintList = ColorStateList.valueOf(theme.accent)
        binding.bottomNav.itemTextColor = ColorStateList.valueOf(theme.text)
        window.statusBarColor = theme.background
        window.navigationBarColor = theme.panel
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars =
            theme.lightSystemBars
        binding.settingsScreen.themeDescription.text =
            if (theme.showExtractedPanel)
                "${theme.titleFa}: المان‌های استخراج‌شده EPS روی داشبورد با داده زنده فعال‌اند."
            else
                "${theme.titleFa}: تم پایه بدون پنل اختصاصی EPS."
    }

    @SuppressLint("MissingPermission")
    private fun setupConnection() {
        val saved = viewModel.savedConnection
        binding.settingsScreen.wifiHost.setText(saved.wifiHost)
        binding.settingsScreen.wifiPort.setText(saved.wifiPort.toString())
        binding.settingsScreen.backgroundCheck.isChecked = saved.keepBackground
        when (saved.type) {
            TransportType.MOCK -> binding.settingsScreen.mockRadio.isChecked = true
            TransportType.WIFI_TCP -> binding.settingsScreen.wifiRadio.isChecked = true
            TransportType.BLUETOOTH_CLASSIC -> binding.settingsScreen.bluetoothRadio.isChecked = true
        }
        refreshBluetoothDevices()
        binding.settingsScreen.connectButton.setOnClickListener {
            val type = when (binding.settingsScreen.transportGroup.checkedRadioButtonId) {
                R.id.wifiRadio -> TransportType.WIFI_TCP
                R.id.mockRadio -> TransportType.MOCK
                else -> TransportType.BLUETOOTH_CLASSIC
            }
            val address = bluetoothItems.getOrNull(
                binding.settingsScreen.bluetoothDeviceSpinner.selectedItemPosition
            )?.second
            val settings = ConnectionSettings(
                type,
                address,
                binding.settingsScreen.wifiHost.text.toString().trim(),
                binding.settingsScreen.wifiPort.text.toString().toIntOrNull() ?: 35000,
                binding.settingsScreen.backgroundCheck.isChecked
            )
            requestAndConnect(settings)
        }
        binding.settingsScreen.disconnectButton.setOnClickListener {
            viewModel.disconnect()
            stopService(Intent(this, ObdConnectionService::class.java))
        }
    }

    @SuppressLint("MissingPermission")
    private fun refreshBluetoothDevices() {
        if (Build.VERSION.SDK_INT >= 31 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            bluetoothItems = emptyList()
            binding.settingsScreen.bluetoothDeviceSpinner.adapter = ArrayAdapter(
                this,
                android.R.layout.simple_spinner_dropdown_item,
                listOf("ابتدا مجوز اتصال را بدهید")
            )
            return
        }
        val adapter = (getSystemService(BLUETOOTH_SERVICE) as BluetoothManager).adapter
        bluetoothItems = adapter?.bondedDevices
            ?.map { (it.name ?: "ELM327") to it.address }
            ?.sortedBy { it.first }
            .orEmpty()
        binding.settingsScreen.bluetoothDeviceSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            bluetoothItems.map { "${it.first} — ${it.second}" }
                .ifEmpty { listOf("دستگاه Pair شده‌ای پیدا نشد") }
        )
    }

    private fun requestAndConnect(settings: ConnectionSettings) {
        pendingConnect = settings
        val missing = PlatformPolicy.requiredPermissions().filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) beginConnect(settings)
        else connectionPermissionLauncher.launch(missing.toTypedArray())
    }

    private fun beginConnect(settings: ConnectionSettings) {
        ContextCompat.startForegroundService(this, Intent(this, ObdConnectionService::class.java))
        viewModel.connect(settings)
    }

    private fun collectState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect(::render)
            }
        }
    }

    private fun render(state: MainUiState) {
        state.vehicle?.let {
            loadLogo(binding.dashboardScreen.vehicleLogo, it)
            loadLogo(binding.mydiagHomeScreen.homeVehicleLogo, it)
            binding.mydiagHomeScreen.homeVehicleTitle.text = "${it.make} ${it.model}"
        }
        if (state.connection.status == ConnectionStatus.ERROR) {
            stopService(Intent(this, ObdConnectionService::class.java))
        }
        binding.connectionBadge.text = state.connection.message
        binding.mydiagHomeScreen.homeConnectionText.text = state.connection.message
        binding.connectionBadge.setTextColor(
            ContextCompat.getColor(
                this,
                if (state.connection.status == ConnectionStatus.CONNECTED) R.color.green
                else R.color.orange
            )
        )
        binding.dashboardScreen.vehicleTitle.text = state.vehicle?.let {
            "${it.make} ${it.model}"
        } ?: "خودروی انتخاب نشده"
        binding.dashboardScreen.demoBadge.visibility =
            if (state.vehicle?.isDemo == true) View.VISIBLE else View.GONE
        binding.dashboardScreen.demoResetButton.visibility = View.VISIBLE
        binding.dashboardScreen.demoResetButton.text =
            if (state.vehicle?.isDemo == true) "اجرای دوباره دمو" else "شروع دمو"
        binding.dashboardScreen.protocolText.text = state.detection?.let {
            "${it.protocol ?: "--"} · VIN: ${it.vin ?: "ناموجود"}"
        } ?: state.connection.protocol.orEmpty()
        binding.dashboardScreen.speedGauge.setValue((state.live.speedKph ?: 0).toFloat())
        binding.dashboardScreen.rpmGauge.setValue((state.live.rpm ?: 0.0).toFloat())
        binding.dashboardScreen.epsThemePanel.setLive(
            (state.live.speedKph ?: 0.0).toFloat(),
            (state.live.rpm ?: 0.0).toFloat(),
            (state.live.coolantC ?: 0).toFloat(),
            (state.live.voltage ?: 0.0).toFloat(),
            (state.live.engineLoad ?: 0.0).toFloat()
        )
        binding.dashboardScreen.coolantText.text =
            "آب\n${state.live.coolantC?.let { "$it °C" } ?: "--"}"
        binding.dashboardScreen.loadText.text =
            "بار\n${state.live.engineLoad?.let { "%.0f %%".format(it) } ?: "--"}"
        binding.dashboardScreen.voltageText.text =
            "ولتاژ\n${state.live.voltage?.let { "%.1f V".format(it) } ?: "--"}"
        renderDtcs(state.dtcs)
        binding.vehicleScreen.detectResult.text = state.detection?.let {
            "پروتکل: ${it.protocol}\nVIN: ${it.vin ?: "ناموجود"}\n" +
                "Calibration: ${it.calibrationId ?: "ناموجود"}\n" +
                "ECU: ${it.ecuName ?: "ناموجود"}\nاطمینان: ${it.confidence}٪"
        } ?: "هنوز شناسایی اجرا نشده است."
        binding.settingsScreen.adapterLog.text = state.log.takeLast(12)
            .joinToString("\n")
            .ifBlank { "آماده" }
        binding.scannerScreen.scannerStatus.text = when {
            state.monitorActive -> "شنود فعال"
            state.connection.status == ConnectionStatus.CONNECTED -> "متصل"
            else -> state.connection.message
        }
        binding.scannerScreen.scannerStatus.setTextColor(
            ContextCompat.getColor(this, if (state.connection.status == ConnectionStatus.CONNECTED) R.color.green else R.color.orange)
        )
        binding.scannerScreen.consoleOutput.text = state.consoleLog.joinToString("\n")
        binding.scannerScreen.monitorOutput.text = state.monitorLog.joinToString("\n")
        binding.scannerScreen.logFilePath.text = state.logFilePath
        binding.scannerScreen.logEntryCount.text = "${state.logEntryCount} رکورد"
        binding.scannerScreen.stopMonitor.isEnabled = state.monitorActive
        binding.scannerScreen.startMonitor.isEnabled = state.connection.status == ConnectionStatus.CONNECTED && !state.monitorActive
        binding.scannerScreen.sendConsoleCommand.isEnabled = state.connection.status == ConnectionStatus.CONNECTED && !state.monitorActive && !state.busy
        binding.scannerScreen.runProfileInit.isEnabled = state.connection.status == ConnectionStatus.CONNECTED && !state.monitorActive && !state.busy
        binding.scannerScreen.applyMonitorFilter.isEnabled = state.connection.status == ConnectionStatus.CONNECTED && !state.monitorActive && !state.busy
        setBusy(state.busy)
    }

    private fun renderDtcs(items: List<DtcRecord>) {
        val list = binding.dtcScreen.dtcList
        list.removeAllViews()
        if (items.isEmpty()) {
            list.addView(TextView(this).apply {
                text = "خطایی خوانده نشده است."
                setTextColor(ContextCompat.getColor(context, R.color.muted))
                setPadding(12, 20, 12, 20)
            })
            return
        }
        items.forEach { dtc ->
            list.addView(TextView(this).apply {
                text = "${dtc.code} · ${when (dtc.kind) {
                    DtcKind.STORED -> "ذخیره‌شده"
                    DtcKind.PENDING -> "در انتظار"
                    DtcKind.PERMANENT -> "دائمی"
                }}"
                setTextColor(ContextCompat.getColor(context, R.color.text))
                setBackgroundResource(R.drawable.bg_card)
                setPadding(18, 18, 18, 18)
                layoutParams = LinearLayout.LayoutParams(-1, -2).apply {
                    setMargins(0, 0, 0, 10)
                }
            })
        }
    }

    private fun setBusy(busy: Boolean) {
        binding.settingsScreen.connectButton.isEnabled = !busy
        binding.dtcScreen.readDtcButton.isEnabled = !busy
        binding.dtcScreen.clearDtcButton.isEnabled = !busy
        binding.vehicleScreen.autoDetectButton.isEnabled = !busy
    }

    private fun loadLogo(view: android.widget.ImageView, vehicle: VehicleProfile) {
        val asset = BrandLogoResolver.assetPath(
            this,
            vehicle.make,
            vehicle.model,
            vehicle.logoAsset
        )
        view.load("file:///android_asset/$asset")
    }

    private fun showClearDialog() {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 8, 28, 0)
        }
        val warning = TextView(this).apply {
            text = "فقط خطاهای عمومی آلایندگی موتور پاک می‌شوند. Freeze Frame و Readiness نیز بازنشانی می‌شوند."
        }
        val check = CheckBox(this).apply {
            text = "موتور خاموش است و سوییچ باز است"
        }
        val phrase = EditText(this).apply {
            hint = "عبارت «پاک شود» را بنویس"
        }
        box.addView(warning)
        box.addView(check)
        box.addView(phrase)
        AlertDialog.Builder(this)
            .setTitle("پاک‌کردن DTC با Mode 04")
            .setView(box)
            .setNegativeButton("انصراف", null)
            .setPositiveButton("ارسال فرمان") { _, _ ->
                viewModel.clearDtcs(check.isChecked, phrase.text.toString()) { toast(it) }
            }
            .show()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
