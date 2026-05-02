package com.example.assistiveapp.utils;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Log;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

public class BluetoothHelper {
    private static final String TAG = "BluetoothHelper";
    private static final String DEVICE_NAME = "AssistiveDevice";
    private static final UUID MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"); // Standard SPP UUID

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;
    private boolean isConnected = false;

    public BluetoothHelper() {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    @SuppressLint("MissingPermission")
    public boolean connect() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) return false;

        Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
        BluetoothDevice targetDevice = null;

        for (BluetoothDevice device : pairedDevices) {
            if (DEVICE_NAME.equals(device.getName())) {
                targetDevice = device;
                break;
            }
        }

        if (targetDevice == null) return false;

        try {
            bluetoothSocket = targetDevice.createRfcommSocketToServiceRecord(MY_UUID);
            bluetoothSocket.connect();
            outputStream = bluetoothSocket.getOutputStream();
            isConnected = true;
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Connection failed", e);
            close();
            return false;
        }
    }

    public void sendCommand(String command) {
        if (isConnected && outputStream != null) {
            try {
                String cmdWithNewline = command + "\n";
                outputStream.write(cmdWithNewline.getBytes());
                Log.d(TAG, "Sent: " + command);
            } catch (IOException e) {
                Log.e(TAG, "Send failed", e);
                isConnected = false;
            }
        }
    }

    public void close() {
        try {
            if (outputStream != null) outputStream.close();
            if (bluetoothSocket != null) bluetoothSocket.close();
        } catch (IOException e) {
            Log.e(TAG, "Close failed", e);
        }
        isConnected = false;
    }

    public boolean isConnected() {
        return isConnected;
    }
}
