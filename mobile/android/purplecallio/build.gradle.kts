// FOUNDATION ONLY — see STATUS.md. Not built, not verified (no Android
// SDK/Gradle/JDK available in this environment — see STATUS.md). A real
// implementation needs `org.webrtc:google-webrtc` (or a maintained fork)
// as an implementation dependency, added here once a real toolchain is
// available to resolve and test it.
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.purplecallio.sdk"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        targetSdk = 34
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // implementation("org.webrtc:google-webrtc:1.0.+")
    // implementation("io.socket:socket.io-client:2.1.1")
}
