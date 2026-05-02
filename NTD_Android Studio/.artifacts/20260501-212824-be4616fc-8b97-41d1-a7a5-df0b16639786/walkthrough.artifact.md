# Walkthrough - Assistive App Extensions

This document summarizes the new features added to the Assistive App, including Caretaker SOS, Bluetooth Vibration Patterns, and the Priority Calling System.

## Features Implemented

### 1. Caretaker SOS Listener
- **Firebase Path**: `users/{userId}/commands/`
- **Logic**: The app now listens for changes in the `commands` node. If `sosFromCaretaker` is `true`, it:
    - Triggers Text-to-Speech: "Alert from caretaker".
    - Sends the `patternId` (e.g., "P05") via Bluetooth.
    - Resets the flag to `false`.
- **Files**: [FirebaseHelper.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/FirebaseHelper.java), [MainActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/MainActivity.java)

### 2. Bluetooth Vibration Patterns
- **Commands**: 11 distinct patterns mapped from `P01` to `P11`.
- **Implementation**: A new `BluetoothHelper` manages the Classic Bluetooth connection to a device named "AssistiveDevice".
- **Testing Screen**: A new "Test Patterns" screen allows manual triggering of all 11 patterns.
- **Files**: [BluetoothHelper.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/BluetoothHelper.java), [TestPatternsActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/TestPatternsActivity.java)

### 3. Priority Calling System
- **Contact Management**: `ContactManager` now stores contacts in a specific priority list.
- **Sequential Calling**: On SOS trigger, the app initiates a call to the first contact. It automatically attempts the next contact every 20 seconds.
- **Files**: [ContactManager.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/utils/ContactManager.java), [MainActivity.java](file:///E:/NTD/NTD_Android Studio/app/src/main/java/com/example/assistiveapp/MainActivity.java)

### 4. UI Modernization
- **Dashboard**: Upgraded to a card-based layout with better spacing and color-coded status indicators.
- **SOS Button**: Increased size (300dp) with a circular design and haptic feedback.
- **Files**: [activity_main.xml](file:///E:/NTD/NTD_Android Studio/app/src/main/res/layout/activity_main.xml)

### 5. Hardware Support
- **Snippet**: Provided `hardware_snippet.ino` for ESP32, capable of receiving and parsing the "Pxx" commands.
- **File**: [hardware_snippet.ino](file:///E:/NTD/NTD_Android Studio/hardware_snippet.ino)

## Verification Results
- **Build**: Successfully built using Gradle (`:app:assembleDebug`).
- **Permissions**: All required runtime permissions (Bluetooth, Call, Phone State) are included and requested.
- **Code Integrity**: All new classes are integrated and correctly referenced in `AndroidManifest.xml`.
