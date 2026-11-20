package com.ph.quantumq

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
    override val handleBackNavigation = false
    private var gameWebView: WebView? = null

    override fun onWebViewCreate(webView: WebView) {
        super.onWebViewCreate(webView)
        gameWebView = webView
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    WindowCompat.getInsetsController(window, window.decorView).apply {
        hide(WindowInsetsCompat.Type.systemBars())
        systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = gameWebView
                if (webView == null) {
                    exitToSystem()
                    return
                }

                webView.evaluateJavascript(
                    "window.dispatchEvent(new Event('quantumqback', { cancelable: true }))"
                ) { unhandled ->
                    if (unhandled == "true" && !isFinishing) exitToSystem()
                }
            }

            private fun exitToSystem() {
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
                isEnabled = true
            }
        })
    }
}
