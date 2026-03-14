package com.vita.app;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class IncomingCallActivity extends Activity {

    private String patientUid;
    private String doctorName;
    private String doctorId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.parseColor("#0a0a1a"));
        getWindow().setNavigationBarColor(Color.parseColor("#0a0a1a"));
        patientUid = getIntent().getStringExtra("patientUid");
        doctorName = getIntent().getStringExtra("doctorName");
        doctorId = getIntent().getStringExtra("doctorId");
        if (doctorName == null) doctorName = "Doctor";
        setContentView(buildUI());
    }

    private View buildUI() {
        RelativeLayout root = new RelativeLayout(this);
        root.setBackgroundColor(Color.parseColor("#0a0a1a"));
        LinearLayout center = new LinearLayout(this);
        center.setOrientation(LinearLayout.VERTICAL);
        center.setGravity(Gravity.CENTER_HORIZONTAL);
        center.setId(View.generateViewId());

        View pulseRing = new View(this);
        GradientDrawable ringBg = new GradientDrawable();
        ringBg.setShape(GradientDrawable.OVAL);
        ringBg.setColor(Color.parseColor("#1a3a6b"));
        pulseRing.setBackground(ringBg);
        LinearLayout.LayoutParams ringP = new LinearLayout.LayoutParams(dp(140), dp(140));
        ringP.gravity = Gravity.CENTER;
        center.addView(pulseRing, ringP);
        ObjectAnimator pulse = ObjectAnimator.ofFloat(pulseRing, "alpha", 1f, 0.3f);
        pulse.setDuration(1000);
        pulse.setRepeatCount(ValueAnimator.INFINITE);
        pulse.setRepeatMode(ValueAnimator.REVERSE);
        pulse.start();

        View avatar = new View(this);
        GradientDrawable avBg = new GradientDrawable();
        avBg.setShape(GradientDrawable.OVAL);
        avBg.setColor(Color.parseColor("#2563eb"));
        avatar.setBackground(avBg);
        LinearLayout.LayoutParams avP = new LinearLayout.LayoutParams(dp(120), dp(120));
        avP.gravity = Gravity.CENTER;
        avP.topMargin = dp(-130);
        center.addView(avatar, avP);

        TextView initials = new TextView(this);
        initials.setText(doctorName.substring(0, 1).toUpperCase());
        initials.setTextColor(Color.WHITE);
        initials.setTextSize(TypedValue.COMPLEX_UNIT_SP, 40);
        initials.setTypeface(Typeface.DEFAULT_BOLD);
        initials.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams iP = new LinearLayout.LayoutParams(dp(120), dp(120));
        iP.gravity = Gravity.CENTER;
        iP.topMargin = dp(-120);
        center.addView(initials, iP);

        TextView sub = new TextView(this);
        sub.setText("Incoming Video Call");
        sub.setTextColor(Color.parseColor("#60a5fa"));
        sub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        sub.setGravity(Gravity.CENTER);
        sub.setLetterSpacing(0.1f);
        LinearLayout.LayoutParams sP = wrapLp();
        sP.topMargin = dp(24);
        center.addView(sub, sP);

        TextView name = new TextView(this);
        name.setText(doctorName);
        name.setTextColor(Color.WHITE);
        name.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams nP = wrapLp();
        nP.topMargin = dp(8);
        center.addView(name, nP);

        RelativeLayout.LayoutParams cP = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        cP.addRule(RelativeLayout.CENTER_IN_PARENT);
        root.addView(center, cP);

        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setGravity(Gravity.CENTER);
        btnRow.addView(makeBtn("#dc2626", "\u2716", "Decline", v -> { cancelNotification(); finish(); }), colLp(dp(60)));
        btnRow.addView(makeBtn("#16a34a", "\u2714", "Accept", v -> {
            cancelNotification();
            Intent i = new Intent(this, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            i.putExtra("callAction", "accept");
            i.putExtra("patientUid", patientUid);
            i.putExtra("doctorName", doctorName);
            i.putExtra("doctorId", doctorId);
            startActivity(i);
            finish();
        }), colLp(0));

        RelativeLayout.LayoutParams bP = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        bP.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        bP.bottomMargin = dp(80);
        root.addView(btnRow, bP);
        return root;
    }

    private LinearLayout makeBtn(String color, String icon, String label, View.OnClickListener l) {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER);
        TextView b = new TextView(this);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor(color));
        b.setBackground(bg); b.setText(icon); b.setTextColor(Color.WHITE);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24); b.setGravity(Gravity.CENTER); b.setOnClickListener(l);
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(dp(72), dp(72));
        bp.gravity = Gravity.CENTER; bp.bottomMargin = dp(12);
        col.addView(b, bp);
        TextView lbl = new TextView(this);
        lbl.setText(label); lbl.setTextColor(Color.parseColor("#9ca3af"));
        lbl.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13); lbl.setGravity(Gravity.CENTER);
        col.addView(lbl);
        return col;
    }

    private LinearLayout.LayoutParams colLp(int mr) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        p.rightMargin = mr;
        return p;
    }

    private LinearLayout.LayoutParams wrapLp() {
        return new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    }

    private int dp(int v) { return (int) (v * getResources().getDisplayMetrics().density); }

    private void cancelNotification() {
        NotificationManager m = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        m.cancel(CallActionReceiver.CALL_NOTIFICATION_ID);
    }
}

