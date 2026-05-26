package com.aluhub

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Single-activity wrapper around a full-screen WebView pointing at the
 * deployed web client. Keeping the UI in the web layer guarantees the
 * mobile app and the desktop/mobile-web experience stay pixel-identical
 * — same styles, same background, same responsiveness.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar

    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* result is fine either way */ }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // Match the web's navy topbar so the status bar blends in.
        val navyArgb = Color.parseColor("#071830")
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(navyArgb),
            navigationBarStyle = SystemBarStyle.dark(navyArgb),
        )
        super.onCreate(savedInstanceState)

        val root = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.parseColor("#F4F7FB")) // var(--bg)
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.parseColor("#F4F7FB"))
            isFocusable = true
            isFocusableInTouchMode = true
        }

        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
            progressTintList = android.content.res.ColorStateList.valueOf(
                Color.parseColor("#7eb3f8"),
            )
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                (3 * resources.displayMetrics.density).toInt(),
                android.view.Gravity.TOP,
            )
            visibility = View.GONE
        }

        root.addView(webView)
        root.addView(progress)
        setContentView(root)

        // Apply system-bar insets to the WebView so content sits below the
        // status bar / above the gesture nav (edge-to-edge on Android 15).
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val sb = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.updatePadding(top = sb.top, bottom = sb.bottom, left = sb.left, right = sb.right)
            insets
        }

        configureWebView()

        // Notification plumbing: make sure the channel exists, prompt the
        // user for POST_NOTIFICATIONS on Android 13+, and trigger an FCM
        // token refresh so onNewToken lands in SharedPreferences ASAP.
        AluHubMessagingService.ensureChannel(this)
        maybeRequestNotificationPermission()
        primeFcmToken()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            val initialUrl = buildInitialUrl(intent)
            webView.loadUrl(initialUrl)
        }

        // Hardware back button → WebView history navigation, fall through to
        // default (finish activity) when there's nothing to go back to.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack()
                else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            // Use a Chrome UA so server-side feature detection treats us
            // as a normal browser, not a hidden in-app webview.
            val baseUa = userAgentString
            userAgentString = "$baseUa ALUHubAndroid/${BuildConfig.VERSION_NAME}"
            // Safe Browsing is on by default in WebView since API 26 (our
            // minSdk), so no explicit toggle needed.
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progress.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
                progress.progress = newProgress
            }
        }

        // Bridge the native shell into the web app under window.AluHubNative
        // so the page can fetch the FCM token + request notification opt-in.
        webView.addJavascriptInterface(AluHubBridge(this), "AluHubNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val target = request.url
                // Stay in-app for same-host navigations; open external links
                // (mailto, tel, http(s) to other hosts) in the OS handler.
                val webHost = Uri.parse(getString(R.string.web_app_url)).host ?: return false
                return if (target.scheme == "http" || target.scheme == "https") {
                    if (target.host == webHost) {
                        false
                    } else {
                        runCatching {
                            startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, target))
                        }
                        true
                    }
                } else {
                    runCatching {
                        startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, target))
                    }
                    true
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // Re-prime the FCM token in case it rotated while the app was
        // backgrounded. The WebView's visibilitychange listener will pick
        // the new token up and re-register it with the backend.
        primeFcmToken()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Tapping a notification while the app is alive lands here.
        // Navigate the WebView to the route encoded in the intent extras.
        val route = intent.getStringExtra(EXTRA_DEEP_LINK_ROUTE) ?: return
        webView.loadUrl(routeToUrl(route))
    }

    private fun maybeRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val granted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun primeFcmToken() {
        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result ?: return@addOnCompleteListener
                    val prefs = AluHubMessagingService.getPrefs(this)
                    val existing = prefs.getString(AluHubMessagingService.KEY_FCM_TOKEN, null)
                    val editor = prefs.edit().putString(AluHubMessagingService.KEY_FCM_TOKEN, token)
                    // Only bump the change-stamp when the token actually
                    // differs — keeps the JS cache key stable across the
                    // common case of re-reading the same token on resume.
                    if (existing != token) {
                        editor.putLong(
                            AluHubMessagingService.KEY_FCM_TOKEN_CHANGED_AT,
                            System.currentTimeMillis(),
                        )
                    }
                    editor.apply()
                }
            }
        } catch (t: Throwable) {
            // Firebase isn't initialised — google-services.json missing from build.
            // The app still works; pushes just won't be delivered until it's added.
            android.util.Log.w("AluHub", "Firebase not initialised: ${t.message}")
        }
    }

    private fun buildInitialUrl(intent: Intent?): String {
        val base = getString(R.string.web_app_url)
        val route = intent?.getStringExtra(EXTRA_DEEP_LINK_ROUTE)
        return if (route.isNullOrBlank()) base else routeToUrl(route)
    }

    private fun routeToUrl(route: String): String {
        val base = getString(R.string.web_app_url).trimEnd('/')
        // Routes from the server are app-relative (e.g. "/messages").
        // Strip a leading slash to avoid producing "https://host//path".
        val tail = if (route.startsWith("/")) route else "/$route"
        return base + tail
    }

    companion object {
        const val EXTRA_DEEP_LINK_ROUTE = "deepLinkRoute"
    }

    /**
     * JS bridge surfaced as `window.AluHubNative` inside the WebView.
     * Only synchronous, side-effect-light methods — anything heavier
     * should go through the backend instead.
     */
    private class AluHubBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun getFcmToken(): String? =
            AluHubMessagingService.getPrefs(activity)
                .getString(AluHubMessagingService.KEY_FCM_TOKEN, null)

        /** Unix-millis timestamp of the last onNewToken callback. 0 if
         *  the token has never been minted on this device. The JS layer
         *  uses this to detect rotations without needing a native push. */
        @JavascriptInterface
        fun getFcmTokenChangedAt(): Long =
            AluHubMessagingService.getPrefs(activity)
                .getLong(AluHubMessagingService.KEY_FCM_TOKEN_CHANGED_AT, 0L)

        @JavascriptInterface
        fun openSettings() {
            // Lets the web app deep-link the user to the system
            // notification settings if they previously denied permission.
            val intent = Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, activity.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            runCatching { activity.startActivity(intent) }
        }

        @JavascriptInterface
        fun platform(): String = "android"

        @JavascriptInterface
        fun appVersion(): String = BuildConfig.VERSION_NAME
    }
}
