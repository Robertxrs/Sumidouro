package com.robert.sumidouro;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Adiciona a interface JavaScript "WidgetBridge" no WebView do Capacitor
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void refreshWidget() {
                    SumidouroWidget.refreshWidgetData(MainActivity.this);
                }
            }, "WidgetBridge");
        }

        handleIntentNavigation(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntentNavigation(intent);
    }

    private void handleIntentNavigation(Intent intent) {
        if (intent == null) return;
        boolean abrirRotina = intent.getBooleanExtra("abrir_rotina", false);
        String route = intent.getStringExtra("route");

        if (abrirRotina || "/rotina".equals(route)) {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        bridge.getWebView().evaluateJavascript("window.location.href = '/rotina';", null);
                    }
                });
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        SumidouroWidget.refreshWidgetData(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        SumidouroWidget.refreshWidgetData(this);
    }
}
