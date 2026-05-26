plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Apply the google-services plugin only if the Firebase config file is
// present. Drop google-services.json into this app/ directory to enable
// Firebase Cloud Messaging — until then, the app builds fine but pushes
// are inert (FirebaseMessaging.getInstance() throws at runtime, which
// the messaging service catches and logs).
val googleServicesJson = file("google-services.json")
val firebaseEnabled = googleServicesJson.exists()
if (firebaseEnabled) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.aluhub"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aluhub"
        // 26 = Android 8.0 Oreo. Gives us adaptive launcher icons out of
        // the box (no legacy PNG fallback needed) and covers ~95% of
        // real-world devices. Targets/compiles against 35 (Android 15).
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        // The deployed web app URL the WebView loads. Override at build
        // time with: ./gradlew assembleRelease -PwebAppUrl=https://yourdomain
        val webAppUrl = (project.findProperty("webAppUrl") as String?)
            ?: "https://aluhub.pages.dev"
        resValue("string", "web_app_url", webAppUrl)
    }

    // Real release signing is opt-in via env vars. When all four are set
    // (typically by CI from GitHub secrets), assembleRelease produces a
    // properly-signed APK that Play Protect treats much less harshly than
    // a debug-signed build. Without them we fall back to the debug key so
    // local `gradle assembleRelease` still works during development.
    val releaseKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
    val releaseKeystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
    val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS")
    val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")
    val hasReleaseSigning = !releaseKeystorePath.isNullOrBlank() &&
        !releaseKeystorePassword.isNullOrBlank() &&
        !releaseKeyAlias.isNullOrBlank() &&
        !releaseKeyPassword.isNullOrBlank() &&
        file(releaseKeystorePath!!).exists()

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystorePath!!)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                // Fallback only — debug-signed releases trigger aggressive
                // Play Protect warnings. Set ANDROID_KEYSTORE_* env vars to
                // sign with a real upload keystore (see README).
                logger.warn(
                    "[ALUHub] Release build is using the DEBUG keystore. " +
                    "Set ANDROID_KEYSTORE_PATH/PASSWORD/ALIAS/KEY_PASSWORD " +
                    "to produce a properly-signed APK."
                )
                signingConfigs.getByName("debug")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
        debug {
            // No applicationIdSuffix: the Firebase project only registers
            // com.aluhub, and the google-services plugin fails the build
            // if a variant uses a package name that isn't registered.
            // Trade-off: debug + release APKs can't be installed side by
            // side. For a thin WebView shell that's fine.
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        // AGP 8 turns BuildConfig off by default; MainActivity reads
        // BuildConfig.DEBUG / VERSION_NAME so we need it on.
        buildConfig = true
    }

    lint {
        // AGP runs lint as part of assembleRelease and fails the build on
        // any error. We don't want a missing-translation or monochrome-icon
        // warning to block APK production from CI.
        abortOnError = false
        checkReleaseBuilds = false
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.android.material:material:1.12.0")

    // Firebase Cloud Messaging — push notifications. The BoM pins
    // compatible versions for everything in the firebase-* family so
    // we don't have to track them individually.
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-messaging-ktx")
}
