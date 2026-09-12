package com.robert.sumidouro

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class WidgetTaskItem(
    val id: String,
    val title: String
)

class WidgetRemoteViewsService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return WidgetItemFactory(applicationContext)
    }
}

class WidgetItemFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    private val tasks = mutableListOf<WidgetTaskItem>()

    override fun onCreate() {
        // Inicialização
    }

    override fun onDataSetChanged() {
        tasks.clear()
        try {
            val url = URL("https://sumidouro-beta.vercel.app/api/widget/tasks")
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 10000
                readTimeout = 10000
                useCaches = false
                setRequestProperty("User-Agent", "Mozilla/5.0 (Android Widget)")
                setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate")
                setRequestProperty("Pragma", "no-cache")
            }

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val reader = BufferedReader(InputStreamReader(connection.inputStream, "UTF-8"))
                val contentBuilder = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    if (contentBuilder.isNotEmpty()) {
                        contentBuilder.append("\n")
                    }
                    contentBuilder.append(line)
                }
                reader.close()

                val responseStr = contentBuilder.toString().trim()

                if (responseStr.startsWith("[")) {
                    val jsonArray = JSONArray(responseStr)
                    for (i in 0 until jsonArray.length()) {
                        val item = jsonArray.get(i)
                        if (item is JSONObject) {
                            val id = item.optString("id", item.optString("_id", i.toString()))
                            val title = item.optString("title", item.optString("name", ""))
                            if (title.isNotBlank()) {
                                tasks.add(WidgetTaskItem(id, title))
                            }
                        } else if (item is String && item.isNotBlank()) {
                            val cleanTitle = item.removePrefix("•").removePrefix("-").trim()
                            tasks.add(WidgetTaskItem(i.toString(), cleanTitle))
                        }
                    }
                } else {
                    val lines = responseStr.split("\n")
                    for ((index, l) in lines.withIndex()) {
                        val trimmed = l.trim()
                        if (trimmed.isNotBlank() && !trimmed.contains("Tudo limpo", ignoreCase = true)) {
                            val cleanTitle = trimmed.removePrefix("•").removePrefix("-").removePrefix("*").trim()
                            if (cleanTitle.isNotBlank()) {
                                tasks.add(WidgetTaskItem(index.toString(), cleanTitle))
                            }
                        }
                    }
                }
            }
            connection.disconnect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        tasks.clear()
    }

    override fun getCount(): Int = tasks.size

    override fun getViewAt(position: Int): RemoteViews? {
        if (position < 0 || position >= tasks.size) return null

        val task = tasks[position]
        val rv = RemoteViews(context.packageName, R.layout.widget_list_item)
        rv.setTextViewText(R.id.widget_item_title, task.title)

        // Clique no Círculo / Checkbox "O": Conclui/Alterna a tarefa diretamente no widget
        val toggleFillInIntent = Intent().apply {
            putExtra("target_action", "toggle")
            putExtra("task_id", task.id)
        }
        rv.setOnClickFillInIntent(R.id.widget_item_checkbox, toggleFillInIntent)

        // Clique no Botão "✕": Exclui a tarefa diretamente pelo widget
        val deleteFillInIntent = Intent().apply {
            putExtra("target_action", "delete")
            putExtra("task_id", task.id)
        }
        rv.setOnClickFillInIntent(R.id.widget_item_delete, deleteFillInIntent)

        return rv
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true
}
