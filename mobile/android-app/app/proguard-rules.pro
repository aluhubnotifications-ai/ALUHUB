# Keep WebView JS interfaces (we don't expose any, but cheap insurance).
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
