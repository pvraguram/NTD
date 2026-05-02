package com.example.assistiveapp.utils;

import android.telephony.SmsManager;
import android.util.Log;
import java.util.List;

public class SmsHelper {
    private static final String TAG = "SmsHelper";

    public static void sendEmergencySms(List<String> phoneNumbers, String message) {
        if (phoneNumbers == null || phoneNumbers.isEmpty()) {
            Log.e(TAG, "No emergency contacts found.");
            return;
        }

        SmsManager smsManager = SmsManager.getDefault();
        for (String number : phoneNumbers) {
            try {
                smsManager.sendTextMessage(number, null, message, null, null);
                Log.d(TAG, "SMS sent to: " + number);
            } catch (Exception e) {
                Log.e(TAG, "Failed to send SMS to: " + number, e);
            }
        }
    }
}
