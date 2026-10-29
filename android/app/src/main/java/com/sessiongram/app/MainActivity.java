package com.sessiongram.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;

/**
 * SessionGram's window: plays the credits intro from the APK while the embedded Telegram engine
 * (Python + Telethon in {@link ServerService}) starts, then shows the app served on 127.0.0.1.
 * Developed by Nitin Shukla - https://github.com/n0obcoders
 */
public class MainActivity extends Activity {
    private static final String BASE = "http://127.0.0.1:" + ServerService.PORT;
    private static final String INTRO = "file:///android_asset/web/intro.html";
    private static final int FILE_REQ = 7, MIC_REQ = 8;
    private static final int INTRO_BG = 0xff0b1020;

    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingMic;
    private String pendingAid, pendingChat;
    private volatile boolean serverReady = false;
    private boolean loaded = false, onIntro = false, waiting = false;
    private final Handler ui = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 2);
        }
        startServer();

        root = new FrameLayout(this);
        root.setBackgroundColor(INTRO_BG);
        web = new WebView(this);
        web.setBackgroundColor(INTRO_BG);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        setupEdgeToEdge();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setTextZoom(100);
        CookieManager.getInstance().setAcceptCookie(true);
        web.addJavascriptInterface(new Bridge(), "SGBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("127.0.0.1".equals(u.getHost()) || "file".equals(u.getScheme())) return false;
                openExternal(u);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                onIntro = url.startsWith(INTRO);
                if (onIntro) {
                    styleBars(true);
                    if (serverReady) notifyIntroReady();
                } else if (url.startsWith(BASE) && !url.contains("/api/")) {
                    loaded = true;
                    styleBars(false);
                    deliverPendingOpen();
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame() && req.getUrl().toString().startsWith(BASE)) {
                    // The engine went away (e.g. Android stopped it): show the intro again until it is back.
                    loaded = false;
                    serverReady = false;
                    startServer();
                    ui.post(() -> web.loadUrl(INTRO));
                    waitForServer();
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                String[] types = params.getAcceptTypes();
                if (types != null && types.length == 1 && types[0].startsWith("image/")) i.setType("image/*");
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, "Choose file"), FILE_REQ);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }

            /** Voice messages: the page asks for the microphone, Android asks the user once. */
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                boolean audioOnly = Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                        && request.getOrigin() != null && "127.0.0.1".equals(request.getOrigin().getHost());
                if (!audioOnly) {
                    request.deny();
                    return;
                }
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                } else {
                    if (pendingMic != null) pendingMic.deny();
                    pendingMic = request;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_REQ);
                }
            }
        });

        web.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) -> {
            try {
                String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                r.addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url));
                r.setMimeType(mimeType);
                r.setTitle(name);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
                Toast.makeText(this, "Downloading " + name, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        });

        // Android 13+ back gesture (predictive back is the default from Android 16).
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }

        handleIntent(getIntent());
        web.loadUrl(INTRO);
        waitForServer();
    }

    private void startServer() {
        if (ServerService.running) return;
        Intent svc = new Intent(this, ServerService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(svc); else startService(svc);
    }

    /** Draw behind the status and navigation bars (required from Android 15) and pad the content by their size and the keyboard. */
    private void setupEdgeToEdge() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets b = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                v.setPadding(b.left, b.top, b.right, b.bottom);
                return WindowInsets.CONSUMED;
            });
        } else {
            root.setFitsSystemWindows(true);
        }
        if (Build.VERSION.SDK_INT < 35) {
            w.setStatusBarColor(Color.TRANSPARENT);
            w.setNavigationBarColor(Color.TRANSPARENT);
        }
    }

    /** Light or dark status/navigation bar icons, matching the intro (dark) or the app's theme. */
    private void styleBars(boolean intro) {
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        if (intro) applyBars(true, INTRO_BG); else styleBarsFor(night);
    }

    private void styleBarsFor(boolean dark) {
        applyBars(dark, dark ? 0xff111622 : 0xffffffff);
    }

    private void applyBars(boolean darkBg, int bg) {
        root.setBackgroundColor(bg);
        web.setBackgroundColor(bg);
        if (Build.VERSION.SDK_INT >= 30) {
            android.view.WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                int light = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(darkBg ? 0 : light, light);
            }
        } else if (Build.VERSION.SDK_INT >= 26) {
            View d = getWindow().getDecorView();
            int f = d.getSystemUiVisibility();
            int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            d.setSystemUiVisibility(darkBg ? (f & ~light) : (f | light));
        }
    }

    /** JavaScript bridge used by the intro page. */
    private class Bridge {
        @JavascriptInterface
        public void enter() {
            ui.post(MainActivity.this::enterApp);
        }

        /** The app page reports its theme so the system bar icons stay readable. */
        @JavascriptInterface
        public void setDark(boolean dark) {
            ui.post(() -> { if (loaded) styleBarsFor(dark); });
        }

        @JavascriptInterface
        public void openUrl(String url) {
            ui.post(() -> openExternal(Uri.parse(url)));
        }
    }

    private void enterApp() {
        if (!serverReady || loaded || ServerService.TOKEN == null) return;
        web.loadUrl(BASE + "/api/applogin?t=" + ServerService.TOKEN);
    }

    private void openExternal(Uri u) {
        String scheme = u.getScheme();
        if (scheme == null || !(scheme.equals("http") || scheme.equals("https") || scheme.equals("tg") || scheme.equals("mailto"))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception e) {
            Toast.makeText(this, "No app can open this link", Toast.LENGTH_SHORT).show();
        }
    }

    private void notifyIntroReady() {
        web.evaluateJavascript("window.sgServerReady && sgServerReady()", null);
        // Opened from a message notification: skip straight to the chat.
        if (pendingAid != null) ui.postDelayed(this::enterApp, 600);
    }

    /** Poll the embedded engine until it answers, then tell the intro it can continue. */
    private void waitForServer() {
        if (waiting) return;
        waiting = true;
        new Thread(() -> {
            try {
                for (int i = 0; i < 480; i++) {
                    if (ServerService.startError != null) {
                        final String err = ServerService.startError.replace("'", " ").replace("\n", " ");
                        ui.post(() -> web.evaluateJavascript("window.sgServerError && sgServerError('SessionGram could not start: " + err + "')", null));
                        return;
                    }
                    if (i == 40) ui.post(() -> web.evaluateJavascript("window.sgServerSlow && sgServerSlow()", null));
                    try {
                        HttpURLConnection c = (HttpURLConnection) new URL(BASE + "/api/auth").openConnection();
                        c.setConnectTimeout(1000);
                        c.setReadTimeout(2000);
                        int code = c.getResponseCode();
                        c.disconnect();
                        if (code == 200 && ServerService.TOKEN != null) {
                            serverReady = true;
                            ui.post(() -> { if (onIntro) notifyIntroReady(); });
                            return;
                        }
                    } catch (Exception ignored) {
                    }
                    Thread.sleep(500);
                }
                ui.post(() -> web.evaluateJavascript("window.sgServerError && sgServerError('SessionGram is taking too long to start. Close and reopen the app.')", null));
            } catch (InterruptedException ignored) {
            } finally {
                waiting = false;
            }
        }, "sessiongram-wait").start();
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String aid = intent.getStringExtra("aid"), chat = intent.getStringExtra("chat");
        if (aid != null && chat != null && aid.matches("[0-9]+") && chat.matches("-?[0-9]+")) {
            pendingAid = aid;
            pendingChat = chat;
            if (loaded) deliverPendingOpen();
            else if (onIntro && serverReady) enterApp();
        }
    }

    private void deliverPendingOpen() {
        if (pendingAid == null) return;
        web.evaluateJavascript("window.sgOpen && sgOpen('" + pendingAid + "','" + pendingChat + "')", null);
        pendingAid = pendingChat = null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        ServerService.appVisible = true;
        if (!ServerService.running) {
            serverReady = false;
            startServer();
            if (!onIntro) web.loadUrl(INTRO);
            loaded = false;
            waitForServer();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        ServerService.appVisible = false;
    }

    private void handleBack() {
        if (!loaded) {
            moveTaskToBack(true);
            return;
        }
        web.evaluateJavascript("(window.sgBack && sgBack()) ? 'y' : 'n'", v -> {
            if (v == null || !v.contains("y")) moveTaskToBack(true);
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBack();   // Android 12 and older
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MIC_REQ && pendingMic != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingMic.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                pendingMic.deny();
            }
            pendingMic = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_REQ || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int i = 0; i < clip.getItemCount(); i++) result[i] = clip.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }
}
