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
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar

data class RoutineBlockItem(
    val title: String,
    val startTime: String,
    val endTime: String,
    val tag: String
)

class SumidouroWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_WIDGET_CLICK = "com.robert.sumidouro.ACTION_WIDGET_CLICK"
        const val ACTION_REFRESH_WIDGET = "com.robert.sumidouro.ACTION_REFRESH_WIDGET"

        @JvmStatic
        fun refreshWidgetData(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, SumidouroWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (id in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, id)
            }
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list_view)
        }

        @JvmStatic
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.sumidouro_widget)

            // Configura o RemoteAdapter com a WidgetRemoteViewsService para a ListView de tarefas
            val serviceIntent = Intent(context, WidgetRemoteViewsService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(this.toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_list_view, serviceIntent)
            views.setEmptyView(R.id.widget_list_view, R.id.empty_view)

            val flagImmutable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0

            // PendingIntent para atualizar widget ao clicar no título
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

            // PendingIntent para o botão "📱 App"
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

            // PendingIntent para o botão "+"
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

            // PendingIntent para clicar na Seção de Rotina (abre a tela /rotina)
            val routineIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                putExtra("route", "/rotina")
                putExtra("abrir_rotina", true)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val routinePendingIntent = PendingIntent.getActivity(
                context,
                1004,
                routineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or flagImmutable
            )
            views.setOnClickPendingIntent(R.id.btn_open_routine, routinePendingIntent)

            // PendingIntent Template para cliques na ListView
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

            // Preenche inicialmente a rotina offline
            updateRoutineViewsOffline(views)
            appWidgetManager.updateAppWidget(appWidgetId, views)

            // Busca rotina via API em thread separada
            fetchRoutineAndUpdateViews(context, appWidgetManager, appWidgetId)
        }

        private fun updateRoutineViewsOffline(views: RemoteViews) {
            val calendar = Calendar.getInstance()
            val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) // 2 = Segunda, 3 = Terça ...
            val isMonday = dayOfWeek == Calendar.MONDAY

            val modeText = if (isMonday) "Segunda (Folga)" else "Terça a Dom (Trabalho)"
            views.setTextViewText(R.id.txt_routine_mode, modeText)

            val curMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
            val blocks = if (isMonday) getDayOffBlocks() else getWorkdayBlocks()

            val currentIndex = blocks.indexOfFirst { isTimeInBlock(it.startTime, it.endTime, curMinutes) }
            if (currentIndex != -1) {
                val current = blocks[currentIndex]
                val next = blocks[(currentIndex + 1) % blocks.size]

                views.setTextViewText(R.id.txt_routine_current_title, current.title)
                views.setTextViewText(R.id.txt_routine_current_time, "${current.startTime} - ${current.endTime} • [${current.tag}]")
                views.setTextViewText(R.id.txt_routine_next, "Próximo: ${next.startTime} • ${next.title}")
            } else {
                views.setTextViewText(R.id.txt_routine_current_title, "Sem atividade no momento")
                views.setTextViewText(R.id.txt_routine_current_time, "--:-- - --:--")
                views.setTextViewText(R.id.txt_routine_next, "Próximo: --")
            }
        }

        private fun fetchRoutineAndUpdateViews(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            Thread {
                try {
                    val url = URL("https://sumidouro-beta.vercel.app/api/widget/routine")
                    val connection = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 5000
                        readTimeout = 5000
                        useCaches = false
                    }

                    if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                        val reader = BufferedReader(InputStreamReader(connection.inputStream, "UTF-8"))
                        val responseStr = reader.readText()
                        reader.close()

                        val json = JSONObject(responseStr)
                        val modeLabel = json.optString("modeLabel", "Rotina")
                        val currentObj = json.optJSONObject("currentBlock")
                        val nextObj = json.optJSONObject("nextBlock")

                        val views = RemoteViews(context.packageName, R.layout.sumidouro_widget)
                        views.setTextViewText(R.id.txt_routine_mode, modeLabel)

                        if (currentObj != null) {
                            val title = currentObj.optString("title", "Sem atividade")
                            val start = currentObj.optString("startTime", "")
                            val end = currentObj.optString("endTime", "")
                            val tag = currentObj.optString("tag", "")

                            views.setTextViewText(R.id.txt_routine_current_title, title)
                            views.setTextViewText(R.id.txt_routine_current_time, "$start - $end • [$tag]")
                        }

                        if (nextObj != null) {
                            val nextTitle = nextObj.optString("title", "")
                            val nextStart = nextObj.optString("startTime", "")
                            views.setTextViewText(R.id.txt_routine_next, "Próximo: $nextStart • $nextTitle")
                        }

                        appWidgetManager.updateAppWidget(appWidgetId, views)
                    }
                    connection.disconnect()
                } catch (e: Exception) {
                    // Fallback mantido sem erros
                }
            }.start()
        }

        private fun isTimeInBlock(startStr: String, endStr: String, curMin: Int): Boolean {
            val start = parseMinutes(startStr)
            val end = parseMinutes(endStr)
            return if (start < end) {
                curMin in start until end
            } else {
                curMin >= start || curMin < end
            }
        }

        private fun parseMinutes(timeStr: String): Int {
            val parts = timeStr.split(":")
            if (parts.size != 2) return 0
            return parts[0].toInt() * 60 + parts[1].toInt()
        }

        private fun getWorkdayBlocks(): List<RoutineBlockItem> = listOf(
            RoutineBlockItem("Acordar", "06:30", "06:45", "Transição"),
            RoutineBlockItem("Exercício Físico", "06:45", "07:45", "Treino"),
            RoutineBlockItem("Banho e Café da manhã", "07:45", "08:30", "Rotina"),
            RoutineBlockItem("Deslocamento / Preparação", "08:30", "09:00", "Transição"),
            RoutineBlockItem("Trabalho", "09:00", "19:00", "Trabalho"),
            RoutineBlockItem("Retorno e Jantar", "19:00", "19:45", "Rotina"),
            RoutineBlockItem("Projeto Dale", "19:45", "21:45", "Foco"),
            RoutineBlockItem("Jogos / Lazer", "21:45", "23:15", "Lazer"),
            RoutineBlockItem("Desconectar Telas", "23:15", "23:30", "Transição"),
            RoutineBlockItem("Sono", "23:30", "06:30", "Descanso")
        )

        private fun getDayOffBlocks(): List<RoutineBlockItem> = listOf(
            RoutineBlockItem("Despertar natural e café com calma", "07:30", "08:30", "Rotina"),
            RoutineBlockItem("Treino solto (corda/bike)", "08:30", "09:45", "Treino"),
            RoutineBlockItem("Tempo offline e descanso", "09:45", "11:30", "Descanso"),
            RoutineBlockItem("Almoço", "11:30", "13:30", "Rotina"),
            RoutineBlockItem("Deep Work - Projeto Dale", "13:30", "17:30", "Foco"),
            RoutineBlockItem("Café da tarde e pausa", "17:30", "18:00", "Transição"),
            RoutineBlockItem("Sessão de jogos e lazer", "18:00", "22:30", "Lazer"),
            RoutineBlockItem("Jantar leve e reset para terça", "22:30", "23:30", "Transição"),
            RoutineBlockItem("Sono", "23:30", "07:30", "Descanso")
        )
    }

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
}
