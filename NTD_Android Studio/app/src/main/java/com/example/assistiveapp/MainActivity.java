package com.example.assistiveapp;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.telephony.TelephonyManager;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.example.assistiveapp.services.LocationUpdateService;
import com.example.assistiveapp.utils.BluetoothHelper;
import com.example.assistiveapp.utils.ContactManager;
import com.example.assistiveapp.utils.FirebaseHelper;
import com.example.assistiveapp.utils.SmsHelper;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.firebase.auth.FirebaseAuth;

import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity implements TextToSpeech.OnInitListener {

    private static final int PERMISSION_REQUEST_CODE = 100;
    private FusedLocationProviderClient fusedLocationClient;
    private ContactManager contactManager;
    private BluetoothHelper bluetoothHelper;
    private TextToSpeech tts;
    private TextView tvLocation, tvStatus, tvBattery;
    private FirebaseAuth mAuth;

    private int currentContactIndex = 0;
    private final Handler callHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mAuth = FirebaseAuth.getInstance();
        if (mAuth.getCurrentUser() == null) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);

        tvLocation = findViewById(R.id.tvLocation);
        tvStatus = findViewById(R.id.tvStatus);
        tvBattery = findViewById(R.id.tvBattery);
        View btnSOS = findViewById(R.id.btnSOS);
        View btnTest = findViewById(R.id.btnTest);
        View btnContacts = findViewById(R.id.btnContacts);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        contactManager = new ContactManager(this);
        bluetoothHelper = new BluetoothHelper();
        tts = new TextToSpeech(this, this);

        btnSOS.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
            handleSosAction();
        });

        btnTest.setOnClickListener(v -> {
            startActivity(new Intent(MainActivity.this, TestPatternsActivity.class));
        });

        btnContacts.setOnClickListener(v -> {
            startActivity(new Intent(MainActivity.this, EmergencyContactsActivity.class));
        });

        requestPermissions();
        startTrackingService();
        
        // Bluetooth connect
        bluetoothHelper.connect();
        updateBluetoothUI();

        // Allow manual reconnection by tapping the status text
        tvStatus.setOnClickListener(v -> {
            Toast.makeText(MainActivity.this, "Connecting to Bluetooth...", Toast.LENGTH_SHORT).show();
            boolean connected = bluetoothHelper.connect();
            updateBluetoothUI();
            if (!connected) {
                Toast.makeText(MainActivity.this, "Make sure 'AssistiveDevice' is paired in Android Settings!", Toast.LENGTH_LONG).show();
            }
        });

        // Firebase Command Listener
        FirebaseHelper.listenForCaretakerCommands(new FirebaseHelper.CommandListener() {
            @Override
            public void onCommandReceived(String patternId, String patternName) {
                if ("P12".equals(patternId)) {
                    // Caretaker Acknowledged
                    callHandler.removeCallbacksAndMessages(null); // Cancel the 7s countdown and any ongoing calls
                    bluetoothHelper.sendCommand(patternId);
                    speak("Caretaker has received your SOS.");
                    Toast.makeText(MainActivity.this, "Caretaker Acknowledged SOS!", Toast.LENGTH_LONG).show();
                    return;
                }

                String type = FirebaseHelper.getDisabilityType();
                
                if (type != null && type.contains("Blind") && !type.contains("Deaf")) {
                    speak("An alert was sent from the caretaker. Alert name: " + patternName);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> triggerVibrationSequence(patternId), 4000);
                } else {
                    // Deaf Only or Blind and Deaf
                    triggerVibrationSequence(patternId);
                }
                
                Toast.makeText(MainActivity.this, "Caretaker Alert: " + patternName, Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onTurnOnBluetoothRequested() {
                try {
                    Intent enableBtIntent = new Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    startActivity(enableBtIntent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Cannot request Bluetooth", Toast.LENGTH_SHORT).show();
                }
            }
        });
        
        setupBatteryListener();
    }

    private void updateBluetoothUI() {
        if (bluetoothHelper.isConnected()) {
            tvStatus.setText("Device: Connected");
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.ic_launcher_background));
        } else {
            tvStatus.setText("Device: Searching...");
            tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray));
        }
    }

    private void triggerVibrationSequence(String patternId) {
        // 1st Vibration: Attention (P04 is our Attention pattern)
        bluetoothHelper.sendCommand("P04");
        
        // 2nd Vibration: The actual message
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            bluetoothHelper.sendCommand(patternId);
        }, 2000);
        
        // 3rd Vibration: The actual message repeated
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            bluetoothHelper.sendCommand(patternId);
        }, 4000);
    }

    private void setupBatteryListener() {
        android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = registerReceiver(null, ifilter);
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
            int batteryPct = (int) (level * 100 / (float) scale);
            tvBattery.setText("Battery: " + batteryPct + "%");
        }
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            String[] permissions = {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.CALL_PHONE,
                    Manifest.permission.READ_PHONE_STATE,
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.POST_NOTIFICATIONS
            };
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            String[] permissions = {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.CALL_PHONE,
                    Manifest.permission.READ_PHONE_STATE,
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT
            };
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
        
        // Background location needs to be requested separately on Android 10+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Please allow 'Always' location access for caretaker tracking", Toast.LENGTH_LONG).show();
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, 101);
            }
        }
    }

    private void startTrackingService() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Intent serviceIntent = new Intent(this, LocationUpdateService.class);
            ContextCompat.startForegroundService(this, serviceIntent);
        }
    }

    private void handleSosAction() {
        FirebaseHelper.setSosAlert(true);
        Toast.makeText(this, "SOS Alert Triggered!", Toast.LENGTH_SHORT).show();

        // Sequential calling
        currentContactIndex = 0;
        
        // Cancel any existing calls and schedule the first call for 7 seconds later
        callHandler.removeCallbacksAndMessages(null);
        callHandler.postDelayed(() -> {
            startPriorityCalling();
        }, 7000);

        // Location & SMS
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.getLastLocation().addOnSuccessListener(this, location -> {
                String message = "EMERGENCY! I need help.";
                if (location != null) {
                    double lat = location.getLatitude();
                    double lng = location.getLongitude();
                    message += " My location: https://www.google.com/maps?q=" + lat + "," + lng;
                    FirebaseHelper.updateLocation(lat, lng);
                }
                sendSmsToContacts(message);
            });
        }
    }

    private void startPriorityCalling() {
        List<String> contacts = contactManager.getContacts();
        if (contacts.isEmpty() || currentContactIndex >= contacts.size()) {
            Toast.makeText(this, "Sequential calling finished.", Toast.LENGTH_SHORT).show();
            return;
        }

        String phoneNumber = contacts.get(currentContactIndex);
        makeCall(phoneNumber);

        // Schedule next call in 20 seconds
        callHandler.postDelayed(() -> {
            currentContactIndex++;
            startPriorityCalling();
        }, 20000);
    }

    private void makeCall(String phoneNumber) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + phoneNumber));
            startActivity(intent);
        } else {
            Toast.makeText(this, "Call permission denied", Toast.LENGTH_SHORT).show();
        }
    }

    private void sendSmsToContacts(String message) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED) {
            List<String> contacts = contactManager.getContacts();
            if (!contacts.isEmpty()) {
                SmsHelper.sendEmergencySms(contacts, message);
            }
        }
    }

    private void speak(String text) {
        if (tts != null) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, null);
        }
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            tts.setLanguage(Locale.US);
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (bluetoothHelper != null) {
            bluetoothHelper.close();
        }
        callHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            startTrackingService();
            bluetoothHelper.connect();
        }
    }
}
