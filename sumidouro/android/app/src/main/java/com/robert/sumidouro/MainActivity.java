package com.robert.sumidouro;

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
                    SumidouroWidget.Companion.refreshWidgetData(MainActivity.this);
                }
            }, "WidgetBridge");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        SumidouroWidget.Companion.refreshWidgetData(this);
    }

    @Override
    protected void onPause() {
        super.onPause();
        SumidouroWidget.Companion.refreshWidgetData(this);
    }
}
