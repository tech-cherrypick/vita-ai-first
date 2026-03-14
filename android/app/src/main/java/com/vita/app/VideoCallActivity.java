package com.vita.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class VideoCallActivity extends Activity {

    private static final int PERMISSION_REQUEST_CODE = 200;
    private WebView webView;
    private String serverUrl;
    private String patientId;
    private String doctorName;
    private String doctorId;
    private String patientName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        serverUrl = getIntent().getStringExtra("serverUrl");
        patientId = getIntent().getStringExtra("patientId");
        doctorName = getIntent().getStringExtra("doctorName");
        doctorId = getIntent().getStringExtra("doctorId");
        patientName = getIntent().getStringExtra("patientName");
        if (serverUrl == null) serverUrl = "https://vita-ai-first.onrender.com";
        if (patientName == null) patientName = "Patient";

        if (hasPermissions()) {
            setupWebView();
        } else {
            requestPermissions();
        }

        launchMainAppInBackground();
    }

    private boolean hasPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(this,
            new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO},
            PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        setupWebView();
    }

    private void setupWebView() {
        webView = new WebView(this);
        FrameLayout container = new FrameLayout(this);
        container.setBackgroundColor(0xFF0A0A1A);
        container.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(container);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        String url = "file:///android_asset/videocall.html"
            + "?serverUrl=" + Uri.encode(serverUrl)
            + "&patientId=" + Uri.encode(patientId != null ? patientId : "")
            + "&doctorName=" + Uri.encode(doctorName != null ? doctorName : "Doctor")
            + "&patientName=" + Uri.encode(patientName);

        webView.loadUrl(url);
    }

    private void launchMainAppInBackground() {
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        mainIntent.putExtra("backgroundLoad", true);
        startActivity(mainIntent);
    }

    private class AndroidBridge {
        @JavascriptInterface
        public void onCallEnded() {
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.destroy();
                    webView = null;
                }
                finish();
            });
        }
    }

    @Override
    public void onBackPressed() {
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}

