import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriConfig = JsonSlurper().parse(rootProject.file("../../tauri.conf.json")) as Map<*, *>
val androidBundle = (tauriConfig["bundle"] as Map<*, *>)["android"] as Map<*, *>

val releaseSigning = mapOf(
    "storeFile" to providers.environmentVariable("QUANTUMQ_KEYSTORE").orNull,
    "storePassword" to providers.environmentVariable("QUANTUMQ_KEYSTORE_PASSWORD").orNull,
    "keyAlias" to providers.environmentVariable("QUANTUMQ_KEY_ALIAS").orNull,
    "keyPassword" to providers.environmentVariable("QUANTUMQ_KEY_PASSWORD").orNull,
)
val hasReleaseSigning = releaseSigning.values.all { !it.isNullOrBlank() }

android {
    if (hasReleaseSigning) {
        signingConfigs.create("quantumqRelease") {
            storeFile = file(releaseSigning.getValue("storeFile")!!)
            storePassword = releaseSigning.getValue("storePassword")
            keyAlias = releaseSigning.getValue("keyAlias")
            keyPassword = releaseSigning.getValue("keyPassword")
        }
    }
    compileSdk = 36
    namespace = "com.ph.quantumq"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.ph.quantumq"
        minSdk = (androidBundle["minSdkVersion"] as Number).toInt()
        targetSdk = 36
        versionCode = (androidBundle["versionCode"] as Number).toInt()
        versionName = tauriConfig["version"] as String
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("quantumqRelease")
            isMinifyEnabled = true
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")
