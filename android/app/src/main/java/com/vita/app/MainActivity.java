package com.vita.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.view.View;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();

        // Apply safe area padding on the parent CoordinatorLayout so the WebView
        // is positioned below the status bar / display cutout.
        // Must be on the PARENT — CoordinatorLayout doesn't dispatch insets to
        // children that lack fitsSystemWindows or a Behavior.
        View webViewParent = (View) webView.getParent();
        ViewCompat.setOnApplyWindowInsetsListener(webViewParent, (v, insets) -> {
            Insets safeArea = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            int bottomPadding = Math.max(safeArea.bottom, ime.bottom);
            v.setPadding(0, safeArea.top, 0, bottomPadding);
            return WindowInsetsCompat.CONSUMED;
        });

        requestRuntimePermissions();

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        handleCallIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
    }

    private void handleCallIntent(Intent intent) {
        if (intent == null) return;
        String callAction = intent.getStringExtra("callAction");
        if (!"accept".equals(callAction)) return;

        String patientUid = intent.getStringExtra("patientUid");
        String doctorName = intent.getStringExtra("doctorName");
        String doctorId = intent.getStringExtra("doctorId");

        intent.removeExtra("callAction");

        String detail = "{ patientId: '" + escapeJs(patientUid) + "',"
                + " doctorName: '" + escapeJs(doctorName) + "',"
                + " doctorId: '" + escapeJs(doctorId) + "' }";

        String setAndDispatch = "window.__pendingCallAccept = " + detail + ";"
                + "window.dispatchEvent(new CustomEvent('callAcceptedFromNotification', { detail: " + detail + " }));";

        WebView webView = this.bridge.getWebView();
        int[] delays = {0, 500, 1500, 3000, 5000, 8000};
        for (int delay : delays) {
            webView.postDelayed(() -> webView.evaluateJavascript(setAndDispatch, null), delay);
        }
    }

    private String escapeJs(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("'", "\\'");
    }

    private void requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean needsRequest = false;
            for (String permission : REQUIRED_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    needsRequest = true;
                    break;
                }
            }
            if (needsRequest) {
                ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE);
            }
        }
    }
}
