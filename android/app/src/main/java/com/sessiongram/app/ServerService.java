package com.sessiongram.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.SecureRandom;

/** Runs the embedded Python (Telethon) server in the background so accounts stay connected. */
public class ServerService extends Service {
    public static final int PORT = 18765;
    public static volatile String TOKEN;
    public static volatile boolean running = false;
    public static volatile String startError;
    public static volatile boolean appVisible = false;

    private static final String CH_SERVICE = "service";
    private static final String CH_MESSAGES = "messages";
    private static final String ACTION_EXIT = "com.sessiongram.app.EXIT";
    private static final String GROUP = "sessiongram_messages";
    private static final int SUMMARY_ID = 2;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_EXIT.equals(intent.getAction())) {
            stopForeground(true);
            stopSelf();
            android.os.Process.killProcess(android.os.Process.myPid());
            return START_NOT_STICKY;
        }
        startInForeground();
        if (!running) {
            running = true;
            startError = null;
            if (TOKEN == null) {
                byte[] b = new byte[24];
                new SecureRandom().nextBytes(b);
                StringBuilder sb = new StringBuilder();
                for (byte x : b) sb.append(String.format("%02x", x));
                TOKEN = sb.toString();
            }
            final File data = new File(getFilesDir(), "data");
            final File web = new File(getFilesDir(), "web");
            new Thread(() -> {
                try {
                    copyAssets("web", web);
                    if (!Python.isStarted()) Python.start(new AndroidPlatform(this));
                    Python.getInstance().getModule("android_main")
                            .callAttr("run", data.getAbsolutePath(), web.getAbsolutePath(), PORT, TOKEN, this);
                } catch (Throwable t) {
                    Log.e("SessionGram", "server crashed", t);
                    startError = String.valueOf(t);
                }
                running = false;
            }, "sessiongram-server").start();
        }
        return START_STICKY;
    }

    private void startInForeground() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent exit = PendingIntent.getService(this, 1, new Intent(this, ServerService.class).setAction(ACTION_EXIT),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CH_SERVICE)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("SessionGram is connected")
                .setContentText("Your accounts stay online to receive messages")
                .setColor(0xff4c6ef5)
                .setOngoing(true)
                .setContentIntent(pi)
                .addAction(0, "Exit", exit)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1, n);
        }
    }

    /** Called from Python (server.py) when a new incoming message arrives. */
    public void notifyMessage(String title, String text, String aid, String chatId) {
        if (appVisible) return;
        try {
            int id = (aid + ":" + chatId).hashCode();
            Intent i = new Intent(this, MainActivity.class)
                    .putExtra("aid", aid).putExtra("chat", chatId)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(this, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification n = new NotificationCompat.Builder(this, CH_MESSAGES)
                    .setSmallIcon(R.drawable.ic_stat)
                    .setColor(0xff4c6ef5)
                    .setGroup(GROUP)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                    .setAutoCancel(true)
                    .setContentIntent(pi)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .build();
            NotificationManagerCompat nm = NotificationManagerCompat.from(this);
            nm.notify(id, n);
            // Bundle messages from many accounts/chats under one expandable summary.
            nm.notify(SUMMARY_ID, new NotificationCompat.Builder(this, CH_MESSAGES)
                    .setSmallIcon(R.drawable.ic_stat)
                    .setColor(0xff4c6ef5)
                    .setContentTitle("SessionGram")
                    .setContentText("New messages")
                    .setGroup(GROUP)
                    .setGroupSummary(true)
                    .setAutoCancel(true)
                    .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
                    .build());
        } catch (SecurityException e) {
            Log.w("SessionGram", "notification permission missing");
        }
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CH_SERVICE, "Background connection", NotificationManager.IMPORTANCE_MIN));
        NotificationChannel msgs = new NotificationChannel(CH_MESSAGES, "Messages", NotificationManager.IMPORTANCE_HIGH);
        msgs.enableVibration(true);
        nm.createNotificationChannel(msgs);
    }

    private void copyAssets(String dir, File dest) throws Exception {
        AssetManager am = getAssets();
        String[] files = am.list(dir);
        if (files == null) return;
        dest.mkdirs();
        for (String f : files) {
            String path = dir + "/" + f;
            String[] sub = am.list(path);
            if (sub != null && sub.length > 0) {
                copyAssets(path, new File(dest, f));
                continue;
            }
            try (InputStream in = am.open(path); OutputStream out = new FileOutputStream(new File(dest, f))) {
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
