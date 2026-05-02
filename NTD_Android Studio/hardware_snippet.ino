/*
  Assistive Shield - ESP32 Hardware Code
  Supports 11 Vibration Patterns (P01 - P11)
*/

#include "BluetoothSerial.h"

BluetoothSerial SerialBT;
const int ACTUATOR_PIN = 12; // Buzzer or Vibration Motor Pin

void setup() {
  Serial.begin(115200);
  SerialBT.begin("AssistiveDevice"); // This MUST match the name in BluetoothHelper.java
  pinMode(ACTUATOR_PIN, OUTPUT);
  Serial.println("Bluetooth Started. Pair your phone with 'AssistiveDevice'.");
}

void loop() {
  if (SerialBT.available()) {
    String command = SerialBT.readString();
    command.trim();
    Serial.print("Received Command: ");
    Serial.println(command);

    if (command == "P01") vibrate(100, 1);       // Short
    else if (command == "P02") vibrate(100, 2);  // Double
    else if (command == "P03") vibrate(500, 1);  // Long
    else if (command == "P04") vibrate(200, 3);  // Attention
    else if (command == "P05") sosPattern();     // SOS
    else if (command == "P06") locationPattern();// Location (Rapid)
    else if (command == "P07") vibrate(800, 1);  // Warning
    else if (command == "P08") vibrate(50, 5);   // Obstacle (Staccato)
    else if (command == "P09") vibrate(1000, 1); // Urgent
    else if (command == "P10") wavePattern();     // Wave
    else if (command == "P11") heartbeatPattern(); // Heartbeat
  }
  delay(20);
}

void vibrate(int duration, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ACTUATOR_PIN, HIGH);
    delay(duration);
    digitalWrite(ACTUATOR_PIN, LOW);
    if (i < times - 1) delay(150);
  }
}

void sosPattern() {
  for (int i = 0; i < 3; i++) vibrate(100, 1); // S
  delay(300);
  for (int i = 0; i < 3; i++) vibrate(400, 1); // O
  delay(300);
  for (int i = 0; i < 3; i++) vibrate(100, 1); // S
}

void locationPattern() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(ACTUATOR_PIN, HIGH);
    delay(50);
    digitalWrite(ACTUATOR_PIN, LOW);
    delay(50);
  }
}

void heartbeatPattern() {
  vibrate(100, 1);
  delay(100);
  vibrate(100, 1);
}

void wavePattern() {
  for(int i=0; i<3; i++) {
    vibrate(100, 1);
    delay(100);
    vibrate(300, 1);
    delay(100);
    vibrate(500, 1);
  }
}
