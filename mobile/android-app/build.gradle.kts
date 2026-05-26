// Top-level build file. Plugins are applied in the app module.
plugins {
    id("com.android.application") version "8.6.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    // Google services plugin — applied conditionally in app/build.gradle.kts
    // only when google-services.json is present, so CI builds don't break
    // before the Firebase config file is committed.
    id("com.google.gms.google-services") version "4.4.2" apply false
}
