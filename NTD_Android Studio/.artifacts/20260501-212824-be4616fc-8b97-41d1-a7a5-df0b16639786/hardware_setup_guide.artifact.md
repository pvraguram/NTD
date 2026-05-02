# Hardware Connection & Vibration Guide

This guide explains how to link the Android app to your Bluetooth module (ESP32/HC-05) and how to make the buzzer/vibrator react to the app's commands.

## 1. Connecting the App to Bluetooth

The app uses **Bluetooth Classic (SPP)** to talk to the hardware. Follow these steps to pair them:

1.  **On your Phone**: Go to **Settings > Bluetooth**.
2.  **On your Hardware**: Ensure your ESP32 is powered on and running the `hardware_snippet.ino` code.
3.  **Pairing**: Look for a device named **"AssistiveDevice"**. Tap it and pair with it.
4.  **In the App**:
    *   Open the app.
    *   It will automatically look for the paired device named "AssistiveDevice".
    *   The dashboard will show **"Device: Connected"** in the top-left card once the link is established.

## 2. Hardware Wiring (ESP32 Example)

Connect your vibration motor or buzzer as follows:

-   **Positive (+)** wire of the motor/buzzer -> **GPIO 12** on ESP32.
-   **Negative (-)** wire of the motor/buzzer -> **GND** on ESP32.

> [!TIP]
> If you are using a high-power vibration motor, use a transistor (like PN2222) to protect the ESP32 pin.

## 3. How the Vibration Logic Works

1.  **App Side**: When you press SOS or a caretaker sends an alert, the app sends a short string like `"P05"` over the Bluetooth serial channel.
2.  **Hardware Side**: The ESP32 receives this string, identifies it as "P05" (the SOS pattern), and calls the `sosPattern()` function.
3.  **Vibration**: The function toggles GPIO 12 HIGH and LOW in a specific rhythm to create the "vibration pattern."

## 4. Refined ESP32 Code (Hardware Snippet)

I have updated the `hardware_snippet.ino` file in your project directory with full support for all 11 patterns.

```cpp
// Example: Parsing the commands
if (command == "P01") vibrate(100, 1);       // Short Vibration
else if (command == "P05") sosPattern();     // SOS Rhythm
else if (command == "P11") heartbeatPattern(); // Double Pulse
```

## 5. Testing the Connection

Use the **"MANUAL PATTERN TEST"** button on the app's dashboard.
-   Tap **"P01"**: Your buzzer should beep once.
-   Tap **"P05"**: Your buzzer should beep in the S-O-S (3 short, 3 long, 3 short) pattern.
