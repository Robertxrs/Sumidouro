package com.robert.sumidouro;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class SumidouroWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sumidouro_widget);
        
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        new Thread(() -> {
            try {
                URL url = new URL("https://sumidouro-beta.vercel.app/api/widget/tasks");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Android Widget)");

                int responseCode = connection.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    throw new Exception("HTTP error code: " + responseCode);
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"));
                StringBuilder contentBuilder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    if (contentBuilder.length() > 0) {
                        contentBuilder.append("\n");
                    }
                    contentBuilder.append(line);
                }
                reader.close();

                String responseStr = contentBuilder.toString().trim();
                String resultText;

                if (responseStr.startsWith("[")) {
                    // Trata caso a resposta seja um array JSON
                    JSONArray jsonArray = new JSONArray(responseStr);
                    if (jsonArray.length() == 0) {
                        resultText = "Tudo limpo! ✨";
                    } else {
                        StringBuilder tasks = new StringBuilder();
                        for (int i = 0; i < jsonArray.length(); i++) {
                            JSONObject obj = jsonArray.getJSONObject(i);
                            tasks.append("• ").append(obj.optString("title", "")).append("\n");
                        }
                        resultText = tasks.toString().trim();
                    }
                } else {
                    // A API retorna o texto já formatado (ex: "• Pagar contas\n• Teste")
                    resultText = responseStr.isEmpty() ? "Tudo limpo! ✨" : responseStr;
                }

                views.setTextViewText(R.id.appwidget_text, resultText);
                appWidgetManager.updateAppWidget(appWidgetId, views);

            } catch (Exception e) {
                e.printStackTrace();
                views.setTextViewText(R.id.appwidget_text, "Erro: " + e.getMessage());
                appWidgetManager.updateAppWidget(appWidgetId, views);
            }
        }).start();
    }
}
