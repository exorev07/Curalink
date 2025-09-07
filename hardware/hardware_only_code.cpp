#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>

// ---------------- PIN CONFIG ----------------
#define SS_PIN        D8        // RC522 SDA
#define RST_PIN       D3        // RC522 RST
#define FSR_PIN       A0        // FSR analog input
#define CLEAN_BTN     D4        // cleaning button (active LOW, GND)
#define LED_PIN       D0        // status LED with 220ohm resistor

// Initialize components
MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// Authorized staff UIDs
String staff1 = "B310C2F5";
String staff2 = "63870DFC";

// State tracking
int bedState = 0;  // 0=unoccupied, 1=occupied, 2=cleaning, 3=clean_verify, 4=showing_staff_id, 5=discharge_prompt, 6=discharge_verify, 7=unassigned
int prevState = -1;
unsigned long ledTimer = 0;
unsigned long staffIdTimer = 0;
unsigned long verifyTimer = 0;
unsigned long dischargePromptTimer = 0;
unsigned long dischargeVerifyTimer = 0;
bool ledOn = false;

// Thresholds
int fsrThreshold = 50;
float tempThreshold = 32.0;
unsigned long tempCheckInterval = 1000;
unsigned long lastTempCheck = 0;

// Button variables for long press detection
int buttonState = HIGH;
int lastButtonState = HIGH;
unsigned long pressedTime = 0;
unsigned long releasedTime = 0;
bool isPressing = false;
bool isLongDetected = false;
const int LONG_PRESS_TIME = 3000;  // 3 seconds for long press

String lastStaffId = "";

void setup() {
  delay(1000);
  pinMode(LED_PIN, OUTPUT);
  pinMode(CLEAN_BTN, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);
  
  Wire.begin(D2, D1);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  if (!mlx.begin()) {
    lcd.setCursor(0, 0);
    lcd.print("MLX90614 Error!");
    while(1);
  }
  
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  delay(1000);
}

void loop() {
  // Check weight
  int fsrValue = analogRead(FSR_PIN);
  bool hasWeight = (fsrValue > fsrThreshold);
  
  // Check temperature
  static bool hasBodyTemp = false;
  if (millis() - lastTempCheck > tempCheckInterval) {
    float objectTemp = mlx.readObjectTempC();
    hasBodyTemp = (objectTemp > tempThreshold);
    lastTempCheck = millis();
  }

  // Update occupancy logic
  if (bedState <= 1) {
    bool isOccupied = hasWeight && hasBodyTemp;
    
    if (isOccupied && bedState == 0) {
      bedState = 1;
    } else if (!isOccupied && bedState == 1) {
      bedState = 0;
    }
  }
  
  // Button handling
  lastButtonState = buttonState;
  buttonState = digitalRead(CLEAN_BTN);
  
  // Button just pressed
  if (lastButtonState == HIGH && buttonState == LOW) {
    pressedTime = millis();
    isPressing = true;
    isLongDetected = false;
  }
  
  // Button just released
  if (lastButtonState == LOW && buttonState == HIGH) {
    releasedTime = millis();
    isPressing = false;
    
    long pressDuration = releasedTime - pressedTime;
    
    // Only trigger SHORT press if long press was NOT detected
    if (pressDuration < LONG_PRESS_TIME && !isLongDetected) {
      // SHORT PRESS - Normal cleaning functionality
      if (bedState == 2) {
        bedState = 3;  // cleaning -> verify
        verifyTimer = millis();
        prevState = -1;
      } else if (bedState != 3 && bedState != 5 && bedState != 6) {
        bedState = 2;  // start cleaning
        prevState = -1;
      }
    }
  }
  
  // Check for LONG PRESS during pressing
  if (isPressing && !isLongDetected) {
    if (millis() - pressedTime > LONG_PRESS_TIME) {
      isLongDetected = true;
      
      // Allow discharge from ALL normal states (0, 1, 7)
      if (bedState == 0 || bedState == 1 || bedState == 7) {
        bedState = 5;  // Go to discharge prompt
        dischargePromptTimer = millis();
        prevState = -1;
      }
    }
  }
  
  // Check for cleaning verification timeout (5 seconds)
  if (bedState == 3 && millis() - verifyTimer > 5000) {
    bedState = 2;  // Go back to cleaning state
    prevState = -1;
  }
  
  // UPDATED: Check for discharge prompt timeout (5 seconds)
  if (bedState == 5 && millis() - dischargePromptTimer > 5000) {
    bool isOccupied = hasWeight && hasBodyTemp;
    bedState = isOccupied ? 1 : 0;
    prevState = -1;
  }
  
  // Check for discharge verification timeout (5 seconds)
  if (bedState == 6 && millis() - dischargeVerifyTimer > 5000) {
    bool isOccupied = hasWeight && hasBodyTemp;
    bedState = isOccupied ? 1 : 0;
    prevState = -1;
  }
  
  // Check RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    // Handle cleaning verification
    if ((uid == staff1 || uid == staff2) && bedState == 3) {
      lastStaffId = uid;
      bedState = 4;
      staffIdTimer = millis();
      prevState = -1;
    }
    
    // Handle discharge prompt
    if ((uid == staff1 || uid == staff2) && bedState == 5) {
      bedState = 6;  // Go to discharge verification
      dischargeVerifyTimer = millis();
      prevState = -1;
    }
    
    // Handle discharge verification
    if ((uid == staff1 || uid == staff2) && bedState == 6) {
      lastStaffId = uid;
      bedState = 4;  // Show staff ID first
      staffIdTimer = millis();
      prevState = -1;
    }
    
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
  
  // Check if staff ID display time is over
  if (bedState == 4 && millis() - staffIdTimer > 2000) {
    if (dischargeVerifyTimer > verifyTimer) {
      bedState = 7;  // Go to unassigned (discharge was more recent)
    } else {
      bool isOccupied = hasWeight && hasBodyTemp;
      bedState = isOccupied ? 1 : 0;  // Cleaning was more recent
    }
    prevState = -1;
  }
  
  // UPDATED LED control
  if (bedState == 2 || bedState == 6) {
    // Blink LED during cleaning and discharge verification
    if (millis() - ledTimer >= 500) {
      ledOn = !ledOn;
      digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
      ledTimer = millis();
    }
  } else if (bedState == 5) {
    // UPDATED: Keep LED ON during discharge prompt (no blinking)
    digitalWrite(LED_PIN, HIGH);
  } else {
    // Turn LED OFF for all other states
    if (ledOn) {
      ledOn = false;
    }
    digitalWrite(LED_PIN, LOW);
  }
  
  // Update display
  static bool lastOccupied = false;
  bool currentOccupied = hasWeight && hasBodyTemp;
  bool forceUpdate = (currentOccupied != lastOccupied && bedState == 2);
  
  if (bedState != prevState || forceUpdate) {
    lcd.clear();
    
    switch (bedState) {
      case 0:
        lcd.setCursor(0, 0);
        lcd.print("Bed: Unoccupied");
        break;
      case 1:
        lcd.setCursor(0, 0);
        lcd.print("Bed: Occupied");
        break;
      case 2:
        lcd.setCursor(0, 0);
        lcd.print("Bed: " + String(currentOccupied ? "Occupied" : "Unoccupied"));
        lcd.setCursor(0, 1);
        lcd.print("Cleaning in progress");
        break;
      case 3:
        lcd.setCursor(0, 0);
        lcd.print("Tap card for");
        lcd.setCursor(0, 1);
        lcd.print("verification!");
        break;
      case 4:
        lcd.setCursor(0, 0);
        lcd.print("Staff ID:");
        lcd.setCursor(0, 1);
        lcd.print(lastStaffId);
        break;
      case 5:  // UPDATED: Enhanced discharge prompt
        lcd.setCursor(0, 0);
        lcd.print("Discharge?");
        lcd.setCursor(0, 1);
        lcd.print("Please tap card!");
        break;
      case 6:
        lcd.setCursor(0, 0);
        lcd.print("Discharging...");
        break;
      case 7:
        lcd.setCursor(0, 0);
        lcd.print("Bed: Unassigned");
        break;
    }
    
    prevState = bedState;
    lastOccupied = currentOccupied;
  }
  
  delay(50);
  yield();
}
