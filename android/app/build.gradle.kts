import java.net.URI

plugins { id("com.android.application") }

android {
    namespace = "com.ecupulse.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.ecupulse.app"
        targetSdk = 36
        versionName = "0.12.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    flavorDimensions += listOf("platform", "store")
    productFlavors {
        create("legacy") {
            dimension = "platform"
            minSdk = 21
            versionCode = 101200
            versionNameSuffix = "-legacy"
            buildConfigField("String", "PLATFORM_FLAVOR", "\"legacy\"")
        }
        create("modern") {
            dimension = "platform"
            minSdk = 30
            versionCode = 201200
            versionNameSuffix = "-modern"
            buildConfigField("String", "PLATFORM_FLAVOR", "\"modern\"")
        }
        create("googlePlay") {
            dimension = "store"
            versionNameSuffix = "-play"
            buildConfigField("String", "STORE_NAME", "\"googlePlay\"")
            manifestPlaceholders["billingPermission"] = "com.android.vending.BILLING"
        }
        create("cafebazaar") {
            dimension = "store"
            versionNameSuffix = "-bazaar"
            buildConfigField("String", "STORE_NAME", "\"cafebazaar\"")
            manifestPlaceholders["billingPermission"] = "com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR"
        }
        create("myket") {
            dimension = "store"
            versionNameSuffix = "-myket"
            buildConfigField("String", "STORE_NAME", "\"myket\"")
            manifestPlaceholders["billingPermission"] = "ir.mservices.market.BILLING"
        }
    }

    buildFeatures { viewBinding = true; buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    packaging { resources.excludes += setOf("META-INF/AL2.0", "META-INF/LGPL2.1") }
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            buildConfigField("boolean", "ALLOW_DEV_AUTH", "true")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            buildConfigField("boolean", "ALLOW_DEV_AUTH", "false")
        }
    }
    androidResources { noCompress += setOf("svg", "json") }
}

val fontAssetDir = layout.projectDirectory.dir("src/main/assets/fonts")
val fetchVazirmatn by tasks.registering {
    group = "assets"
    description = "Downloads Vazirmatn from the official repository if it is not already present."
    doLast {
        val dir = fontAssetDir.asFile.apply { mkdirs() }
        val fonts = mapOf(
            "vazirmatn_regular.ttf" to "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Regular.ttf",
            "vazirmatn_medium.ttf" to "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Medium.ttf",
            "vazirmatn_bold.ttf" to "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Bold.ttf"
        )
        fonts.forEach { (name, url) ->
            val target = dir.resolve(name)
            if (!target.exists()) {
                runCatching { URI(url).toURL().openStream().use { input -> target.outputStream().use(input::copyTo) } }
                    .onFailure { logger.warn("Vazirmatn download failed for $name; system font fallback will be used: ${it.message}") }
            }
        }
    }
}
tasks.named("preBuild").configure { dependsOn(fetchVazirmatn) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("com.google.android.material:material:1.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("io.coil-kt.coil3:coil:3.4.0")
    implementation("io.coil-kt.coil3:coil-svg:3.4.0")
    implementation("androidx.window:window:1.4.0")
    googlePlayImplementation("com.android.billingclient:billing:9.1.0")
    googlePlayImplementation("com.android.billingclient:billing-ktx:9.1.0")
    cafebazaarImplementation("com.github.cafebazaar.Poolakey:poolakey:2.2.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
}
