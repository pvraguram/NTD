package com.example.assistiveapp.utils;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

public class FirebaseHelper {
    private static String disabilityType = "Blind and Deaf";

    private static DatabaseReference getBaseRef() {
        String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
        return FirebaseDatabase.getInstance("https://assistivedashboard-4d8f0-default-rtdb.asia-southeast1.firebasedatabase.app").getReference("users").child(uid);
    }

    public static void updateLocation(double lat, double lng) {
        if (FirebaseAuth.getInstance().getCurrentUser() == null) return;

        Map<String, Object> locationData = new HashMap<>();
        locationData.put("lat", lat);
        locationData.put("lng", lng);
        locationData.put("lastUpdated", System.currentTimeMillis());

        getBaseRef().child("live").setValue(locationData);
    }

    public static void setSosAlert(boolean active) {
        if (FirebaseAuth.getInstance().getCurrentUser() == null) return;
        getBaseRef().child("alerts").child("sos").setValue(active);
    }

    public static void updateDeviceStatus(boolean connected, int battery, String networkSignal, String bluetoothState) {
        if (FirebaseAuth.getInstance().getCurrentUser() == null) return;
        
        Map<String, Object> deviceData = new HashMap<>();
        deviceData.put("connected", connected);
        deviceData.put("battery", battery);
        deviceData.put("networkSignal", networkSignal);
        deviceData.put("bluetoothState", bluetoothState);
        
        getBaseRef().child("device").updateChildren(deviceData);
    }

    public static String getDisabilityType() {
        return disabilityType;
    }

    public interface CommandListener {
        void onCommandReceived(String patternId, String patternName);
        void onTurnOnBluetoothRequested();
    }

    public static void listenForCaretakerCommands(CommandListener listener) {
        if (FirebaseAuth.getInstance().getCurrentUser() == null) return;

        // Listen for Disability Type
        getBaseRef().child("profile").child("disabilityType").addValueEventListener(new com.google.firebase.database.ValueEventListener() {
            @Override
            public void onDataChange(com.google.firebase.database.DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    disabilityType = snapshot.getValue(String.class);
                }
            }
            @Override
            public void onCancelled(com.google.firebase.database.DatabaseError error) {}
        });

        DatabaseReference commandRef = getBaseRef().child("commands");
        commandRef.addValueEventListener(new com.google.firebase.database.ValueEventListener() {
            @Override
            public void onDataChange(com.google.firebase.database.DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    Boolean sos = snapshot.child("sosFromCaretaker").getValue(Boolean.class);
                    String patternId = snapshot.child("patternId").getValue(String.class);
                    String patternName = snapshot.child("patternName").getValue(String.class);
                    Boolean requestBluetoothOn = snapshot.child("requestBluetoothOn").getValue(Boolean.class);

                    if (sos != null && sos) {
                        listener.onCommandReceived(
                            patternId != null ? patternId : "P01",
                            patternName != null ? patternName : "Unknown Alert"
                        );
                        commandRef.child("sosFromCaretaker").setValue(false);
                    }
                    
                    if (requestBluetoothOn != null && requestBluetoothOn) {
                        listener.onTurnOnBluetoothRequested();
                        commandRef.child("requestBluetoothOn").setValue(false);
                    }
                }
            }

            @Override
            public void onCancelled(com.google.firebase.database.DatabaseError error) {}
        });
    }
}
