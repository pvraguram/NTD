#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// 🔹 PIN DEFINITIONS
#define MOTOR_PIN 13
#define BUTTON    12

// 🔹 TIMING
#define LONG_PRESS_MS 1000
#define DEBOUNCE_MS 50

// 🔹 VARIABLES
String receivedText = "";

unsigned long pressTime = 0;
bool wasPressed = false;

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);

  // 🔹 Motor setup
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);   // Ensure motor OFF at start

  pinMode(BUTTON, INPUT_PULLUP);

  SerialBT.begin("AssistiveDevice");

  Serial.println("=== Device Ready ===");
  Serial.println("Bluetooth Started: AssistiveDevice");
}

// ============================================================
// MOTOR FUNCTIONS
// ============================================================
void motorOn() {
  digitalWrite(MOTOR_PIN, HIGH);
  Serial.println("Motor ON");
}

void motorOff() {
  digitalWrite(MOTOR_PIN, LOW);
  Serial.println("Motor OFF");
}

//
// -------- BASIC VIBRATION --------
//
void shortVibe(int d = 150) {
  motorOn();
  delay(d);
  motorOff();
  delay(120);
}

void longVibe(int d = 500) {
  motorOn();
  delay(d);
  motorOff();
  delay(200);
}

//
// -------- 12 VIBRATION PATTERNS --------
//

// P01 – Gentle
void gentle() {
  Serial.println("Pattern: P01 Gentle");
  shortVibe();
}

// P02 – Double Pulse
void doublePulse() {
  Serial.println("Pattern: P02 Double Pulse");
  shortVibe();
  shortVibe();
}

// P03 – Long
void longPulse() {
  Serial.println("Pattern: P03 Long");
  longVibe();
}

// P04 – Attention
void attention() {
  Serial.println("Pattern: P04 Attention");
  shortVibe();
  longVibe();
  shortVibe();
}

// P05 – SOS (User Emergency)
void sosPattern() {
  Serial.println("Pattern: P05 SOS");
  for (int i = 0; i < 3; i++) shortVibe();
  for (int i = 0; i < 3; i++) longVibe();
  for (int i = 0; i < 3; i++) shortVibe();
}

// P06 – Location Update
void locationUpdate() {
  Serial.println("Pattern: P06 Location Update");
  shortVibe();
  delay(300);
  shortVibe();
}

// P07 – Warning
void warning() {
  Serial.println("Pattern: P07 Warning");
  longVibe();
  shortVibe();
  longVibe();
}

// P08 – Obstacle Alert
void obstacle() {
  Serial.println("Pattern: P08 Obstacle Alert");
  shortVibe();
  shortVibe();
  longVibe();
}

// P09 – Urgent Rapid
void urgent() {
  Serial.println("Pattern: P09 Urgent Rapid");
  for (int i = 0; i < 6; i++) shortVibe(80);
}

// P10 – Wave Pattern
void wave() {
  Serial.println("Pattern: P10 Wave Pattern");
  shortVibe(100);
  shortVibe(200);
  shortVibe(300);
  shortVibe(400);
}

// P11 – Heartbeat
void heartbeat() {
  Serial.println("Pattern: P11 Heartbeat");
  shortVibe();
  delay(100);
  longVibe();
}

// P12 – Caretaker Alert (IMPORTANT 🔥)
void caretakerAlert() {
  Serial.println("Pattern: P12 Caretaker Alert / Received");
  for (int i = 0; i < 3; i++) {
    longVibe(600);
    delay(300);
  }
}

// ============================================================
// KEYWORD PROCESSING
// ============================================================
void handlePattern(String cmd) {
  cmd.trim();
  cmd.toUpperCase();

  Serial.print("Processing Command: ");
  Serial.println(cmd);

  if (cmd == "P01" || cmd.indexOf("GENTLE") >= 0) gentle();
  else if (cmd == "P02" || cmd.indexOf("DOUBLE") >= 0) doublePulse();
  else if (cmd == "P03" || cmd.indexOf("LONG") >= 0) longPulse();
  else if (cmd == "P04" || cmd.indexOf("ATTENTION") >= 0) attention();
  else if (cmd == "P05" || cmd.indexOf("SOS") >= 0) sosPattern();
  else if (cmd == "P06" || cmd.indexOf("LOCATION") >= 0) locationUpdate();
  else if (cmd == "P07" || cmd.indexOf("WARNING") >= 0) warning();
  else if (cmd == "P08" || cmd.indexOf("OBSTACLE") >= 0) obstacle();
  else if (cmd == "P09" || cmd.indexOf("URGENT") >= 0) urgent();
  else if (cmd == "P10" || cmd.indexOf("WAVE") >= 0) wave();
  else if (cmd == "P11" || cmd.indexOf("HEARTBEAT") >= 0) heartbeat();
  else if (cmd == "P12" || cmd.indexOf("CARETAKER") >= 0) caretakerAlert();
  else {
    Serial.println("Unknown command");
    motorOn();
    delay(100);
    motorOff();
  }
}

// ============================================================
// BUTTON HANDLING (1 BUTTON)
// ============================================================
void handleButton() {
  bool current = (digitalRead(BUTTON) == LOW);

  // Button pressed
  if (current && !wasPressed) {
    pressTime = millis();
    wasPressed = true;
  }

  // Button released
  if (!current && wasPressed) {
    unsigned long duration = millis() - pressTime;

    if (duration >= LONG_PRESS_MS) {
      Serial.println("Button: LONG PRESS");
      SerialBT.println("YES");
      longPulse();   // feedback
    } 
    else if (duration >= DEBOUNCE_MS) {
      Serial.println("Button: SHORT PRESS");
      SerialBT.println("NO");
      gentle();  // feedback
    }

    wasPressed = false;
  }
}

// ============================================================
// BLUETOOTH READ
// ============================================================
void readBluetoothData() {
  while (SerialBT.available()) {
    char incoming = SerialBT.read();

    if (incoming == '\n' || incoming == '\r') {
      if (receivedText.length() > 0) {
        handlePattern(receivedText);
        receivedText = "";
      }
    } 
    else {
      receivedText += incoming;

      if (receivedText.length() > 100) {
        receivedText = "";
      }
    }
  }
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  readBluetoothData();
  handleButton();
  delay(10);
}