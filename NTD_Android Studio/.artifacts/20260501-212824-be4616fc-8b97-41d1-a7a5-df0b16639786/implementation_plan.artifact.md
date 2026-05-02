# Implementation Plan - Assistive App Extensions

This plan outlines the steps to add caretaker-triggered SOS, Bluetooth vibration patterns, and a priority auto-calling system to the existing Assistive App.

## Proposed Changes

### 1. Permissions & Setup
Add necessary permissions to `AndroidManifest.xml` for Bluetooth, Phone Calls, and Phone State.

#### [AndroidManifest.xml](file:///E:/NTD/NTD_Android Studio/app/src/main/AndroidManifest.xml)
- Add `CALL_PHONE`, `READ_PHONE_STATE`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`, `BLUETOOTH_ADMIN`, `BLUETOOTH`.

### 2. Bluetooth Communication
Create a helper to manage Bluetooth Classic connection to the ESP32.

#### [NEW] [BluetoothHelper.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/BluetoothHelper.java)
- Handle scanning/connecting to a specific device (e.g., "AssistiveDevice").
- Method `sendCommand(String cmd)` to send "P01" to "P11".

### 3. Caretaker SOS Listener (Feature 1 & 2)
Implement a Firebase listener for commands sent by the caretaker.

#### [FirebaseHelper.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/FirebaseHelper.java)
- Add `listenForCaretakerCommands(CommandListener listener)` method.

#### [MainActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/MainActivity.java)
- Initialize Text-to-Speech (TTS).
- Start Firebase command listener.
- On `sosFromCaretaker == true`:
    - Speak "Alert from caretaker".
    - Send Bluetooth command using `BluetoothHelper`.
    - Reset flag in Firebase.

### 4. Priority Calling System (Feature 3)
Upgrade the contact management and implement the sequential calling logic.

#### [ContactManager.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/ContactManager.java)
- Change storage from `Set` to `List` to maintain priority.
- Add methods to set/get contacts in order.

#### [MainActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/MainActivity.java)
- Implement `startPriorityCalling()`:
    - Call Contact 1.
    - Monitor call state using `TelephonyManager`.
    - If not answered in 20s, end call and call next.

### 5. UI Enhancement & Testing Screen (Feature 4 & 5)
Update the main dashboard and add a pattern testing screen.

#### [activity_main.xml](file:///E:/NTD/NTD_Android Studio/app/src/main/res/layout/activity_main.xml)
- Update to use `MaterialCardView`, better spacing, and colors.

#### [NEW] [TestPatternsActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/TestPatternsActivity.java)
- 11 buttons (P01-P11) to test Bluetooth commands.

### 6. Hardware Support
#### [NEW] [hardware_snippet.ino](file:///E:/NTD/NTD_Android Studio/hardware_snippet.ino)
- Minimal ESP32 code to receive "P01"-"P11" and vibrate.

## Verification Plan

### Manual Verification
- **Caretaker SOS**: Manually set `sosFromCaretaker: true` in Firebase console and verify TTS and Bluetooth output.
- **Vibration Patterns**: Use the new Testing Screen to trigger P01-P11.
- **Priority Calling**: Trigger SOS and verify sequential calls (simulated with multiple test phones).
- **UI**: Visual check of the new dashboard.
