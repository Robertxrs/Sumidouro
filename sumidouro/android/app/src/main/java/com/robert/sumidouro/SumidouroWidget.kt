package com.robert.sumidouro

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class SumidouroWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_WIDGET_CLICK -> {
                val targetAction = intent.getStringExtra("target_action")
                val taskId = intent.getStringExtra("task_id")

                when (targetAction) {
                    "toggle" -> if (!taskId.isNullOrEmpty()) toggleTaskAsync(context, taskId)
                    "delete" -> if (!taskId.isNullOrEmpty()) deleteTaskAsync(context, taskId)
                    "open" -> if (!taskId.isNullOrEmpty()) openAppWithTask(context, taskId)
                }
            }
            ACTION_REFRESH_WIDGET -> {
                refreshWidgetData(context)
            }
        }
    }

    private fun toggleTaskAsync(context: Context, taskId: String) {
        sendWidgetApiRequest(context, "toggle", taskId)
    }

    private fun deleteTaskAsync(context: Context, taskId: String) {
        sendWidgetApiRequest(context, "delete", taskId)
    }

    private fun sendWidgetApiRequest(context: Context, actionType: String, taskId: String) {
        Thread {
            try {
                val url = URL("https://sumidouro-beta.vercel.app/api/widget/tasks")
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10000
                    readTimeout = 10000
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    doOutput = true
                }

                val jsonParam = JSONObject().apply {
                    put("action", actionType)
                    put("taskId", taskId)
                }

                val writer = OutputStreamWriter(connection.outputStream, "UTF-8")
                writer.write(jsonParam.toString())
                writer.flush()
                writer.close()

                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    refreshWidgetData(context)
                }
                connection.disconnect()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    private fun openAppWithTask(context: Context, taskId: String) {
        val openIntent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra("task_id", taskId)
            putExtra("ID", taskId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        context.startActivity(openIntent)
    }

        fun refreshWidgetData(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, SumidouroWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (id in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, id)
            }
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list_view)
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.sumidouro_widget)

            // Configura o RemoteAdapter com a WidgetRemoteViewsService para a ListView
            val serviceIntent = Intent(context, WidgetRemoteViewsService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(this.toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_list_view, serviceIntent)
            views.setEmptyView(R.id.widget_list_view, R.id.empty_view)

            val flagImmutable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0

            // PendingIntent para o título "Sumidouro" (atualiza os dados manualmente ao clicar)
            val refreshIntent = Intent(context, SumidouroWidget::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                1000,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or flagImmutable
            )
            views.setOnClickPendingIntent(R.id.widget_title, refreshPendingIntent)

            // PendingIntent para o botão "📱 Abrir App"
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                1003,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or flagImmutable
            )
            views.setOnClickPendingIntent(R.id.btn_open_app, openAppPendingIntent)

            // PendingIntent para o botão "+" (abre MainActivity com extra "abrir_nova_tarefa")
            val addIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                putExtra("action", "abrir_nova_tarefa")
                putExtra("abrir_nova_tarefa", true)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val addPendingIntent = PendingIntent.getActivity(
                context,
                1001,
                addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or flagImmutable
            )
            views.setOnClickPendingIntent(R.id.btn_add_task, addPendingIntent)

            // PendingIntent Template para cliques na ListView (encaminhados para onReceive)
            val clickIntent = Intent(context, SumidouroWidget::class.java).apply {
                action = ACTION_WIDGET_CLICK
            }
            val flagMutable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
            val clickPendingIntent = PendingIntent.getBroadcast(
                context,
                1002,
                clickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or flagMutable
            )
            views.setPendingIntentTemplate(R.id.widget_list_view, clickPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_list_view)
        }
    }
}
