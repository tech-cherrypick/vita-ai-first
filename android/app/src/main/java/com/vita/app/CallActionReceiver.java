package com.vita.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class CallActionReceiver extends BroadcastReceiver {

    public static final String ACTION_ACCEPT = "com.vita.app.ACTION_ACCEPT_CALL";
    public static final String ACTION_REJECT = "com.vita.app.ACTION_REJECT_CALL";
    public static final int CALL_NOTIFICATION_ID = 9999;

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(CALL_NOTIFICATION_ID);

        String action = intent.getAction();

        if (ACTION_ACCEPT.equals(action)) {
            String patientUid = intent.getStringExtra("patientUid");
            String doctorName = intent.getStringExtra("doctorName");
            String doctorId = intent.getStringExtra("doctorId");

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("callAction", "accept");
            launchIntent.putExtra("patientUid", patientUid);
            launchIntent.putExtra("doctorName", doctorName);
            launchIntent.putExtra("doctorId", doctorId);
            context.startActivity(launchIntent);
        }
    }
}

