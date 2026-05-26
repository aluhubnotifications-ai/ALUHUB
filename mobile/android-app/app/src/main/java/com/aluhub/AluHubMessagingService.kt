package com.aluhub

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Handles every push that lands on this device.
 *
 *  - onNewToken: stashes the new FCM token in SharedPreferences so the
 *    in-WebView JS bridge can hand it to the backend the next time the
 *    user is authenticated. (We can't POST it directly from here — we
 *    don't know which user it belongs to until the web app tells us.)
 *
 *  - onMessageReceived: only fires when the app is in the foreground.
 *    Background notifications are handled automatically by the system
 *    from the FCM notification payload (see manifest meta-data).
 *
 *  We catch any exception around the channel/notification posting so a
 *  malformed message can't crash the user's app.
 */
class AluHubMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Stash the token + a "changed at" stamp. The WebView reads the
        // token via the AluHubBridge; the stamp lets the JS layer notice
        // a rotation without needing a push from native code.
        getPrefs(this).edit()
            .putString(KEY_FCM_TOKEN, token)
            .putLong(KEY_FCM_TOKEN_CHANGED_AT, System.currentTimeMillis())
            .apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        try {
            val title = remoteMessage.notification?.title
                ?: remoteMessage.data["title"]
                ?: getString(R.string.app_name)
            val body = remoteMessage.notification?.body
                ?: remoteMessage.data["body"]
                ?: ""
            val route = remoteMessage.data["route"]

            ensureChannel(this)
            postNotification(this, title, body, route)
        } catch (t: Throwable) {
            android.util.Log.w("AluHubMessaging", "failed to post push: ${t.message}")
        }
    }

    companion object {
        const val CHANNEL_ID = "aluhub_default"
        const val CHANNEL_NAME = "ALU Hub"
        const val PREFS = "aluhub_push"
        const val KEY_FCM_TOKEN = "fcm_token"
        const val KEY_FCM_TOKEN_CHANGED_AT = "fcm_token_changed_at"

        fun getPrefs(context: Context): SharedPreferences =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) != null) return
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Messages, bookings, and updates from ALU Hub"
                enableLights(true)
                enableVibration(true)
            }
            nm.createNotificationChannel(channel)
        }

        private fun postNotification(
            context: Context,
            title: String,
            body: String,
            route: String?,
        ) {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                if (!route.isNullOrBlank()) putExtra(MainActivity.EXTRA_DEEP_LINK_ROUTE, route)
            }
            val pending = PendingIntent.getActivity(
                context,
                System.currentTimeMillis().toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pending)

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(System.currentTimeMillis().toInt(), builder.build())
        }
    }
}
