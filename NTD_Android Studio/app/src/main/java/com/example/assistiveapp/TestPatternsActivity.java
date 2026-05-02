package com.example.assistiveapp;

import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.assistiveapp.utils.BluetoothHelper;

public class TestPatternsActivity extends AppCompatActivity {

    private BluetoothHelper bluetoothHelper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_test_patterns);

        bluetoothHelper = new BluetoothHelper();
        bluetoothHelper.connect();

        setupButton(R.id.p01, "P01");
        setupButton(R.id.p02, "P02");
        setupButton(R.id.p03, "P03");
        setupButton(R.id.p04, "P04");
        setupButton(R.id.p05, "P05");
        setupButton(R.id.p06, "P06");
        setupButton(R.id.p07, "P07");
        setupButton(R.id.p08, "P08");
        setupButton(R.id.p09, "P09");
        setupButton(R.id.p10, "P10");
        setupButton(R.id.p11, "P11");

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    private void setupButton(int id, String command) {
        findViewById(id).setOnClickListener(v -> {
            if (bluetoothHelper.isConnected()) {
                bluetoothHelper.sendCommand(command);
                Toast.makeText(this, "Sent: " + command, Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Bluetooth not connected", Toast.LENGTH_SHORT).show();
                bluetoothHelper.connect();
            }
        });
    }

    @Override
    protected void onDestroy() {
        bluetoothHelper.close();
        super.onDestroy();
    }
}
