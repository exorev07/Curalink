#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// Utility function for median calculation - must be before any other code
template<typename T>
inline T medianOf3(T a, T b, T c) {
    if (a > b) {
        if (b > c) return b;        // a > b > c
        if (a > c) return c;        // a > c > b
        return a;                   // c > a > b
    } else {
        if (a > c) return a;        // b > a > c
        if (b > c) return c;        // b > c > a
        return b;                   // c > b > a
    }
}

// ------------------ Configurations ------------------
#define WIFI_SSID       "Exorev's Phone 2a"
#define WIFI_PASSWORD   "REVOLOGY"
#define API_KEY         "AIzaSyB9_UqNfJekvzTaqv_LgGraFdyP0LmWuGo"
#define DATABASE_URL    "https://curalink-6a722-default-rtdb.asia-southeast1.firebasedatabase.app"
#define USER_EMAIL      "ekansharohi1305@gmail.com"
#define USER_PASSWORD   "ekansh@123"

#define BED_ID          1

// Pins
#define SS_PIN          D8
#define RST_PIN         D3
#define FSR_PIN         A0
#define CLEAN_BTN       D4
#define LED_PIN         D0

// Thresholds
#define FSR_THRESHOLD   50
#define TEMP_THRESHOLD  32
#define LONG_PRESS_TIME 3000  // ms
// Timing
#define DEBOUNCE_DELAY      50     // ms
#define BUTTON_READ_DELAY   5      // ms - Reduced for better RFID response
#define FIREBASE_UPDATE_INTERVAL 2000  // ms

// System States
enum SystemState {
  NORMAL,           // 0: Normal operation showing bed status + sensors
  CLEANING,         // 1: Cleaning in progress
  VERIFY_CLEAN,     // 2: Waiting for card to verify cleaning
  DISCHARGE_PROMPT, // 3: Asking for discharge confirmation
  DISCHARGE_VERIFY, // 4: Waiting for card to confirm discharge
  SHOW_STAFF_ID     // 5: Showing staff ID for 2 seconds
};

// Bed States for Firebase
enum BedStatus {
  UNOCCUPIED = 0,
  OCCUPIED = 1,
  UNOCCUPIED_CLEANING = 2,
  OCCUPIED_CLEANING = 3,
  UNASSIGNED = 4
};

// Variables
MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_MLX90614 mlx;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool firebaseConnected = false;

// Firebase last known values for change detection
static BedStatus lastStatus = UNASSIGNED;
static int lastFsrVal = 0;
static float lastTemp = 0;
static bool lastHasBodyTemp = false;
static bool lastHasWeight = false;
static bool lastIsOccupied = false;
static unsigned long lastUpdateTime = 0;

String staff1 = "B310C2F5";  // Staff UID 1 - Full length UID
String staff2 = "63870DFC";  // Staff UID 2 - Full length UID

// System state variables
SystemState currentState = NORMAL;
SystemState previousState = NORMAL;  // To track where to return after showing staff ID
bool bedOccupied = false;
bool prevOccupied = false;
bool bedIsUnassigned = false;  // Track unassigned state

// Button handling
int buttonState = HIGH;
int lastButtonState = HIGH;
unsigned long pressedTime = 0;
bool isPressing = false;
bool longPressDetected = false;

// Timers
unsigned long lastSensorCheck = 0;
unsigned long lastFirebaseUpdate = 0;
unsigned long stateTimer = 0;
unsigned long ledTimer = 0;
unsigned long lastRFIDCheck = 0;  // Add RFID timing
bool ledOn = false;

// Staff ID display
String currentStaffId = "";

// Forward declarations of functions
void initializeWiFiAndFirebase();
void handleButton();
void handleShortPress();
void handleLongPress();
void readSensors();
void processRFID();
void handleStaffCard();
void handleStateTimeouts();
void updateDisplay();
BedStatus getBedStatus();
void updateFirebase();
void updateLED();

void setup() {
    // Disable WiFi sleep mode for better stability
    WiFi.setSleepMode(WIFI_NONE_SLEEP);
    
    delay(2000);  // Give the ESP8266 time to fully start up
    Serial.begin(115200);
    Serial.println("\nStarting...");
    
    // Initialize pins
    pinMode(LED_PIN, OUTPUT);
    pinMode(CLEAN_BTN, INPUT_PULLUP);
    digitalWrite(LED_PIN, LOW);
    
    // Set CPU frequency to 160MHz for better stability
    system_update_cpu_freq(160);
    
    // Initialize I2C for LCD and MLX
    Wire.begin(D2, D1);
    Wire.setClock(100000);  // Slow down I2C for reliability
    delay(100);
    
    // Initialize LCD
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.print("Starting up...");
    delay(100);
    
    // Initialize SPI for RFID
    SPI.begin();
    delay(100);  // Give SPI time to stabilize
    
    // Initialize RFID
    mfrc522.PCD_Init();
    delay(100);  // Give RFID time to stabilize
    
    // Test RFID communication
    byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
    if (version == 0x00 || version == 0xFF) {
        Serial.println("WARNING: RFID Reader may not be properly connected");
        lcd.clear();
        lcd.print("RFID Error!");
        delay(2000);
    }
    
    Serial.println("RFID Reader Initialized");
    Serial.print("RFID Version: 0x");
    Serial.println(version, HEX);
    
    if (!mlx.begin()) {
        lcd.clear();
        lcd.print("MLX Error");
        Serial.println("MLX90614 initialization failed");
        while (true);
    }
    
    // Small delay for sensors to stabilize
    delay(100);
    
    initializeWiFiAndFirebase();
    
    lcd.clear();
    lcd.print("System Ready");
    delay(1000); // Reduced delay
    
    // Initial sensor reading and display
    readSensors();
    updateDisplay();
    
    Serial.println("Setup complete - RFID should work now");
}

void initializeWiFiAndFirebase() {
    lcd.clear();
    lcd.print("Connecting WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(300); // Reduced delay
        Serial.print(".");
    }
    Serial.println("\nWiFi Connected");
    
    lcd.clear();
    lcd.print("Syncing time...");
    configTime(5 * 3600 + 1800, 0, "pool.ntp.org", "time.google.com");
    
    time_t now = 0;
    int retries = 0;
    while (now < 100000) {
        delay(300); // Reduced delay
        now = time(nullptr);
        retries++;
        if (retries > 15) break; // Reduced retries
    }
    
    lcd.clear();
    lcd.print("Init Firebase...");
    
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    
    // Increase timeouts for better stability
    config.timeout.serverResponse = 10000;
    config.timeout.socketConnection = 7000;
    config.timeout.sslHandshake = 7000;
    config.cert.data = nullptr;
    
    // Enable auto retry on failure
    Firebase.RTDB.setMaxRetry(&fbdo, 3);
    Firebase.RTDB.setMaxErrorQueue(&fbdo, 30);
    
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    
    // Wait for initial connection
    while (!Firebase.ready()) {
        delay(100);
        yield();
    }
    
    // Initialize the database structure if needed
    FirebaseJson initialJson;
    initialJson.add("initialized", true);
    initialJson.add("lastBootTime", time(nullptr));
    
    String initPath = "/beds/bed" + String(BED_ID);
    if (Firebase.RTDB.setJSON(&fbdo, initPath.c_str(), &initialJson)) {
        Serial.println("Initial database structure created successfully");
    } else {
        Serial.println("Failed to create initial structure: " + fbdo.errorReason());
    }
}

void loop() {
    static unsigned long lastRFIDCheck = 0;
    static unsigned long lastYield = 0;
    unsigned long currentMillis = millis();
    
    // Give WiFi stack time to process every 50ms
    if (currentMillis - lastYield >= 50) {
        yield();
        lastYield = currentMillis;
    }
    
    // Check for RFID card every 100ms to prevent overwhelming the SPI bus
    if (currentMillis - lastRFIDCheck >= 100) {
        lastRFIDCheck = currentMillis;
        
        if (mfrc522.PICC_IsNewCardPresent()) {
            delay(10);  // Small delay for stability
            
            if (mfrc522.PICC_ReadCardSerial()) {
                String uid = "";
                for (byte i = 0; i < mfrc522.uid.size; i++) {
                    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
                    uid += String(mfrc522.uid.uidByte[i], HEX);
                }
                uid.toUpperCase();
                
                Serial.println("Card detected! UID: " + uid);
                
                if (uid == staff1 || uid == staff2) {
                    currentStaffId = uid;
                    Serial.println("Valid staff card: " + uid);
                    handleStaffCard();
                } else {
                    Serial.println("Unknown card: " + uid);
                    // Show access denied message for any invalid card
                    lcd.clear();
                    lcd.print("Access Denied!");
                    delay(1000);
                    
                    // Return to appropriate state
                    if (currentState == VERIFY_CLEAN) {
                        currentState = CLEANING;
                    }
                    updateDisplay();
                }
                
                mfrc522.PICC_HaltA();
                mfrc522.PCD_StopCrypto1();
            }
        }
    }
    
    // Handle other operations with minimal delays
    if (Firebase.ready() && !firebaseConnected) {
        firebaseConnected = true;
        Serial.println("Firebase connected");
        updateFirebase();
    }

    handleButton();
    readSensors();
    handleStateTimeouts();
    
    // Update display and LED less frequently
    static unsigned long lastUIUpdate = 0;
    if (millis() - lastUIUpdate > 300) {  // Update UI every 300ms instead of 100ms
        updateLED();  // LED can update more frequently
        
        // Only update display if there's been a state change or every 1 second
        static unsigned long lastDisplayUpdate = 0;
        if (millis() - lastDisplayUpdate > 1000) {
            updateDisplay();
            lastDisplayUpdate = millis();
        }
        lastUIUpdate = millis();
    }

    // Firebase updates
    if (firebaseConnected && millis() - lastFirebaseUpdate > FIREBASE_UPDATE_INTERVAL) {
        updateFirebase();
        lastFirebaseUpdate = millis();
    }
    
    // Minimal delay to prevent WDT resets
    delay(1);
    yield();
}

void handleButton() {
    static unsigned long lastPressTime = 0;
    static bool longPressHandled = false;
    int reading = digitalRead(CLEAN_BTN);
    unsigned long currentTime = millis();
    
    // Button is pressed (LOW)
    if (reading == LOW) {
        // Initial press detection
        if (!isPressing) {
            lastPressTime = currentTime;
            pressedTime = currentTime;
            isPressing = true;
            longPressDetected = false;
            longPressHandled = false;
            Serial.println("Button pressed");
        }
        
        // Check for long press while button is held
        if (isPressing && !longPressHandled && (currentTime - pressedTime) >= LONG_PRESS_TIME) {
            longPressDetected = true;
            longPressHandled = true;
            handleLongPress();
            updateDisplay();
        }
    }
    // Button is released (HIGH)
    else if (reading == HIGH && isPressing) {
        unsigned long pressDuration = currentTime - pressedTime;
        isPressing = false;
        
        // Only handle short press if it wasn't a long press
        if (!longPressHandled && pressDuration < LONG_PRESS_TIME) {
            handleShortPress();
            Serial.println("Short press handled");
            updateDisplay();
        }
        
        // Reset states
        longPressDetected = false;
        longPressHandled = false;
    }
}

void handleShortPress() {
    Serial.println("Short press detected, current state: " + String(currentState));
    
    switch (currentState) {
        case NORMAL:
            // Start cleaning only if not unassigned
            if (!bedIsUnassigned) {
                currentState = CLEANING;
                Serial.println("=== Cleaning Mode Started ===");
                // Force immediate Firebase update
                updateFirebase();
                // Add feedback
                lcd.clear();
                lcd.print("Cleaning Mode");
                lcd.setCursor(0, 1);
                lcd.print("Started!");
                delay(500);  // Brief visual feedback
            }
            break;
            
        case CLEANING:
            // Move to verification state and start timer
            currentState = VERIFY_CLEAN;
            stateTimer = millis();  // Start the 5-second timeout timer
            Serial.println("Waiting for staff card verification");
            // Force immediate Firebase update
            updateFirebase();
            // Add feedback
            lcd.clear();
            lcd.print("Tap Staff Card");
            lcd.setCursor(0, 1);
            lcd.print("to Verify");
            break;
            
        case VERIFY_CLEAN:
            // Add ability to cancel verification and go back to cleaning
            currentState = CLEANING;
            Serial.println("Verification cancelled, back to cleaning");
            // Add feedback
            lcd.clear();
            lcd.print("Verification");
            lcd.setCursor(0, 1);
            lcd.print("Cancelled");
            delay(500);  // Brief visual feedback
            break;
            
        default:
            // Give feedback even when ignoring
            lcd.clear();
            lcd.print("Button press");
            lcd.setCursor(0, 1);
            lcd.print("not allowed here");
            delay(500);  // Brief visual feedback
            break;
    }
}

void handleLongPress() {
    Serial.println("Long press detected");
    
    if (currentState == NORMAL && !bedIsUnassigned) {
        // Start discharge process
        currentState = DISCHARGE_PROMPT;
        stateTimer = millis();
        Serial.println("Starting discharge process");
        
        // Provide immediate visual feedback
        lcd.clear();
        lcd.print("Discharge Mode");
        lcd.setCursor(0, 1);
        lcd.print("Tap card to conf.");
        
        // Force immediate Firebase update to reflect state change
        updateFirebase();
    } else {
        // Provide feedback when long press is not valid
        lcd.clear();
        lcd.print("Long press not");
        lcd.setCursor(0, 1);
        lcd.print("allowed here");
        delay(1000);  // Show message briefly
    }
}

void readSensors() {
    static int fsrReadings[3] = {0, 0, 0};
    static float tempReadings[3] = {0, 0, 0};
    static uint8_t readingIndex = 0;
    static unsigned long unoccupiedStartTime = 0;
    const unsigned long UNOCCUPIED_CONFIRM_TIME = 2000; // 2 seconds to confirm unoccupied
    
    if (millis() - lastSensorCheck > 500) {  // Check every 500ms
        // Single readings
        fsrReadings[readingIndex] = analogRead(FSR_PIN);
        tempReadings[readingIndex] = mlx.readObjectTempC();
        readingIndex = (readingIndex + 1) % 3;
        
        // Get current values using median filtering
        int fsrVal = medianOf3(fsrReadings[0], fsrReadings[1], fsrReadings[2]);
        float temp = medianOf3(tempReadings[0], tempReadings[1], tempReadings[2]);
        
        if (!bedIsUnassigned) {
            // Check occupancy conditions
            bool weightDetected = fsrVal > FSR_THRESHOLD;
            bool tempDetected = temp > TEMP_THRESHOLD;  // Must be above 32°C
            bool newOccupancyState = weightDetected && tempDetected;  // BOTH must be true
            
            if (newOccupancyState && !bedOccupied) {
                prevOccupied = bedOccupied;
                bedOccupied = true;
                Serial.printf("Bed now OCCUPIED - Weight: %d, Temp: %.2f (both above threshold)\n", 
                            fsrVal, temp);
                unoccupiedStartTime = 0;
            } 
            else if (!newOccupancyState && bedOccupied) {
                if (unoccupiedStartTime == 0) {
                    unoccupiedStartTime = millis();
                } 
                else if (millis() - unoccupiedStartTime > UNOCCUPIED_CONFIRM_TIME) {
                    prevOccupied = bedOccupied;
                    bedOccupied = false;
                    if (prevOccupied) {
                        Serial.println("Occupancy changed: UNOCCUPIED");
                    }
                    unoccupiedStartTime = 0;
                }
            } 
            else {
                unoccupiedStartTime = 0;
            }
        }
        
        lastSensorCheck = millis();
    }
}

void processRFID() {
    // Check for new card every loop iteration - no timing restrictions
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        String uid = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) {
            if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
            uid += String(mfrc522.uid.uidByte[i], HEX);
        }
        uid.toUpperCase();

        Serial.println("RFID DETECTED: " + uid);

        if (uid == staff1 || uid == staff2) {
            currentStaffId = uid;
            Serial.println("VALID STAFF CARD: " + uid);
            handleStaffCard();
        } else {
            Serial.println("Unknown card: " + uid);
            // Show access denied message for any invalid card
            lcd.clear();
            lcd.print("Access Denied!");
            delay(1000);
            
            // Return to appropriate state
            if (currentState == VERIFY_CLEAN) {
                currentState = CLEANING;
            }
            updateDisplay();
        }

        mfrc522.PICC_HaltA();
        mfrc522.PCD_StopCrypto1();
        // No delay here, let loop handle timing
    }
}

void handleStaffCard() {
    Serial.println("Valid staff card detected in state: " + String(currentState));
    
    switch (currentState) {
        case VERIFY_CLEAN:
            // Show staff ID first, then complete cleaning
            previousState = VERIFY_CLEAN;
            currentState = SHOW_STAFF_ID;
            stateTimer = millis();
            Serial.println("Showing staff ID, then completing cleaning");
            break;
            
        case DISCHARGE_VERIFY:
            // Show staff ID first, then discharge
            previousState = DISCHARGE_VERIFY;
            currentState = SHOW_STAFF_ID;
            stateTimer = millis();
            Serial.println("Showing staff ID, then discharging");
            break;
            
        case DISCHARGE_PROMPT:
            // Show staff ID first, then move to verification
            previousState = DISCHARGE_PROMPT;
            currentState = SHOW_STAFF_ID;
            stateTimer = millis();
            Serial.println("Showing staff ID, then discharge verification");
            break;
            
        case NORMAL:
            // If bed is unassigned, staff can reassign it
            if (bedIsUnassigned) {
                bedIsUnassigned = false;
                bedOccupied = false;
                currentState = SHOW_STAFF_ID;
                previousState = NORMAL;
                stateTimer = millis();
                Serial.println("Bed reassigned by staff: " + currentStaffId);
            }
            break;
            
        default:
            Serial.println("RFID ignored in current state");
            break;
    }
}

void handleStateTimeouts() {
    unsigned long currentTime = millis();
    
    switch (currentState) {
        case VERIFY_CLEAN:
            if (currentTime - stateTimer > 5000) { // 5 second timeout - go back to cleaning
                lcd.clear();
                lcd.print("Timeout!");
                delay(1000);
                currentState = CLEANING;
                Serial.println("Cleaning verification timeout - returning to cleaning state");
                updateDisplay();
            }
            break;
            
        case DISCHARGE_PROMPT:
            if (currentTime - stateTimer > 5000) { // 5 second timeout
                currentState = NORMAL;
                Serial.println("Discharge prompt timeout");
            }
            break;
            
        case DISCHARGE_VERIFY:
            if (currentTime - stateTimer > 10000) { // 10 second timeout
                currentState = NORMAL;
                Serial.println("Discharge verification timeout");
            }
            break;
            
        case SHOW_STAFF_ID:
            if (currentTime - stateTimer > 2000) { // 2 second display
                // Handle what happens after showing staff ID
                if (previousState == VERIFY_CLEAN) {
                    // Complete cleaning
                    lcd.clear();
                    lcd.print("Cleaning");
                    lcd.setCursor(0, 1);
                    lcd.print("Completed!");
                    delay(1000);
                    currentState = NORMAL;
                    Serial.println("Cleaning verified, back to normal");
                    
                } else if (previousState == DISCHARGE_VERIFY) {
                    // Complete discharge - set bed to unassigned
                    bedIsUnassigned = true;
                    bedOccupied = false;  // Force unoccupied state
                    currentState = NORMAL;
                    Serial.println("Discharge confirmed, bed set to UNASSIGNED");
                    // Force Firebase update immediately
                    updateFirebase();
                    
                } else if (previousState == DISCHARGE_PROMPT) {
                    // Move to discharge verification
                    currentState = DISCHARGE_VERIFY;
                    stateTimer = millis();
                    Serial.println("Moving to discharge verification");
                    
                } else {
                    // Return to normal
                    currentState = NORMAL;
                }
            }
            break;
    }
}

void updateDisplay() {
    static SystemState lastDisplayState = (SystemState)-1;
    static bool lastOccupiedDisplay = !bedOccupied;
    static bool lastUnassignedDisplay = !bedIsUnassigned;
    static BedStatus lastBedStatus = (BedStatus)-1;
    
    // Get current bed status
    BedStatus currentBedStatus = getBedStatus();
    
    // Update display only if something has changed
    if (currentState == lastDisplayState && 
        bedOccupied == lastOccupiedDisplay && 
        bedIsUnassigned == lastUnassignedDisplay && 
        currentBedStatus == lastBedStatus && 
        currentState != NORMAL && 
        currentState != CLEANING) {
        return;
    }
    
    // Update last known values
    lastBedStatus = currentBedStatus;
    
    lastDisplayState = currentState;
    lastOccupiedDisplay = bedOccupied;
    lastUnassignedDisplay = bedIsUnassigned;
    
    lcd.clear();
    
    switch (currentState) {
        case NORMAL:
        {
            // First line: Fixed text
            lcd.print("Bed Status:");
            
            // Second line: Current status
            lcd.setCursor(0, 1);
            if (bedIsUnassigned) {
                lcd.print("UNASSIGNED: Scan!");
            } else {
                // Get real-time status based on current sensor values
                BedStatus currentStatus = getBedStatus();
                switch (currentStatus) {
                    case OCCUPIED:
                        lcd.print("OCCUPIED");
                        break;
                    case UNOCCUPIED:
                        lcd.print("UNOCCUPIED");
                        break;
                    default:
                        lcd.print("UNOCCUPIED");
                        break;
                }
            }
            break;
        }
            
        case CLEANING:
        {
            // First line: Current occupancy status
            BedStatus currentStatus = getBedStatus();
            lcd.print("Stat: ");
            if (currentStatus == OCCUPIED_CLEANING) {
                lcd.print("Occupied");
            } else {
                lcd.print("Unoccupied");
            }
            
            // Second line: Cleaning status
            lcd.setCursor(0, 1);
            lcd.print("Cleaning...");
            break;
        }
            
        case VERIFY_CLEAN:
        {
            lcd.print("Tap card for");
            lcd.setCursor(0, 1);
            lcd.print("verification!");
            break;
        }
            
        case DISCHARGE_PROMPT:
        {
            lcd.print("Discharge?");
            lcd.setCursor(0, 1);
            lcd.print("Tap card!");
            break;
        }
            
        case DISCHARGE_VERIFY:
        {
            lcd.print("Discharging...");
            lcd.setCursor(0, 1);
            lcd.print("Tap card again!");
            break;
        }
            
        case SHOW_STAFF_ID:
        {
            lcd.print("Staff ID:");
            lcd.setCursor(0, 1);
            lcd.print(currentStaffId);
            break;
        }
    }
}

BedStatus getBedStatus() {
    if (bedIsUnassigned) {
        return UNASSIGNED;
    }
    
    // Get current sensor values with error checking
    int fsrVal = analogRead(FSR_PIN);
    float temp;
    
    // Add error checking for temperature sensor
    if (mlx.readObjectTempC() > -20 && mlx.readObjectTempC() < 100) {
        temp = mlx.readObjectTempC();
    } else {
        temp = lastTemp;  // Use last valid temperature if reading is invalid
    }
    
    // Check occupancy conditions
    bool hasWeight = fsrVal > FSR_THRESHOLD;
    bool hasTemp = temp > TEMP_THRESHOLD;  // Must be above 32°C
    bool isActuallyOccupied = hasWeight && hasTemp;  // Only true if BOTH conditions are met
    
    switch (currentState) {
        case NORMAL:
        case SHOW_STAFF_ID:
        case DISCHARGE_PROMPT:
        case DISCHARGE_VERIFY:
            if (!isActuallyOccupied) {
                return UNOCCUPIED;
            }
            return OCCUPIED;  // Only if both conditions are met
            
        case CLEANING:
        case VERIFY_CLEAN:  // Keep cleaning state during verification
            if (!isActuallyOccupied) {
                return UNOCCUPIED_CLEANING;
            }
            return OCCUPIED_CLEANING;  // Only if both conditions are met
            
        default:
            if (!isActuallyOccupied) {
                return UNOCCUPIED;
            }
            return OCCUPIED;  // Only if both conditions are met
    }
}

void updateFirebase() {
    if (!firebaseConnected || !Firebase.ready()) {
        Serial.println("Firebase not ready, skipping update");
        return;
    }
    
    // Read current values with error checking
    BedStatus status = getBedStatus();
    int fsrVal = analogRead(FSR_PIN);
    float temp;
    
    // Add error checking for temperature sensor
    if (mlx.readObjectTempC() > -20 && mlx.readObjectTempC() < 100) {
        temp = mlx.readObjectTempC();
    } else {
        Serial.println("Invalid temperature reading, using last known value");
        temp = lastTemp;
    }
    
    bool hasBodyTemp = temp > TEMP_THRESHOLD;  // Only true if above 32°C
    bool hasWeight = fsrVal > FSR_THRESHOLD;
    // Bed is only occupied if both temperature and weight conditions are met
    bool isOccupied = hasBodyTemp && hasWeight && !bedIsUnassigned;
    
    // Check if we need to update with more precise thresholds
    bool valueChanged = (status != lastStatus ||
                        abs(fsrVal - lastFsrVal) > 100 ||  // FSR threshold
                        abs(temp - lastTemp) > 0.5 ||      // More sensitive temp threshold
                        hasBodyTemp != lastHasBodyTemp ||
                        hasWeight != lastHasWeight ||
                        isOccupied != lastIsOccupied);
                        
    unsigned long now = millis();
    // Update every 2 seconds if no changes, to ensure data consistency
    bool timeToUpdate = (now - lastUpdateTime) >= 2000;
    
    // Only update if values changed or minimum interval passed
    if (!valueChanged && !timeToUpdate) return;
    
    String statusStr = "";
    switch (status) {
        case UNOCCUPIED: statusStr = "unoccupied"; break;
        case OCCUPIED: statusStr = "occupied"; break;
        case UNOCCUPIED_CLEANING: statusStr = "unoccupied+cleaning"; break;
        case OCCUPIED_CLEANING: statusStr = "occupied+cleaning"; break;
        case UNASSIGNED: statusStr = "unassigned"; break;
    }
    
    // Construct the path
    String path = "/beds";  // Root path for all beds
    FirebaseJson json;
    
    // Clear and rebuild the JSON object
    json.clear();
    
    // Get current timestamp
    time_t now_time = time(nullptr);
    
    // Create a fresh JSON structure
    json.add("id", BED_ID);
    json.add("status", statusStr);
    json.add("fsrValue", fsrVal);
    json.add("hasBodyTemp", hasBodyTemp);
    json.add("hasWeight", hasWeight);
    json.add("isOccupied", isOccupied);
    json.add("temperature", temp);
    json.add("lastUpdate", (int)now_time);
    json.add("online", true);
    
    // Prepare JSON data
    String jsonStr;
    json.toString(jsonStr, true);
    
    // Try to update Firebase with improved retry mechanism
    bool success = false;
    int retries = 0;
    const int MAX_RETRIES = 3;
    
    while (!success && retries < MAX_RETRIES) {
        // Check WiFi connection before attempting update
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi disconnected, attempting reconnect...");
            WiFi.reconnect();
            delay(1000);
            retries++;
            continue;
        }
        
        // Attempt Firebase update with specific bed path
        String specificPath = path + "/bed" + String(BED_ID);  // Creates /beds/bed1
        if (Firebase.RTDB.setJSON(&fbdo, specificPath.c_str(), &json)) {
            success = true;
            
            // Update last values after successful update
            lastStatus = status;
            lastFsrVal = fsrVal;
            lastTemp = temp;
            lastHasBodyTemp = hasBodyTemp;
            lastHasWeight = hasWeight;
            lastIsOccupied = isOccupied;
            lastUpdateTime = now;
            
            // Update connection status
            firebaseConnected = true;
        } else {
            // Only print error on final retry
            if (retries == MAX_RETRIES - 1) {
                Serial.println("Firebase update failed: " + fbdo.errorReason());
            }
            
            // Different delay based on error type
            if (fbdo.errorReason().indexOf("timeout") >= 0) {
                delay(1000);  // Longer delay for timeout
            } else {
                delay(500);   // Shorter delay for other errors
            }
            
            retries++;
            
            // Reset Firebase connection on repeated failures
            if (retries == MAX_RETRIES) {
                Serial.println("Resetting Firebase connection...");
                firebaseConnected = false;
            }
        }
        yield();  // Give system time to process
    }
}

void updateLED() {
    unsigned long now = millis();
    
    if (currentState == CLEANING) {
        // Blink LED during cleaning
        if (now - ledTimer > 500) {
            ledTimer = now;
            ledOn = !ledOn;
            digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
        }
    } else if (bedIsUnassigned) {
        // Solid LED for unassigned
        if (!ledOn) {
            ledOn = true;
            digitalWrite(LED_PIN, HIGH);
        }
    } else {
        // LED off for normal states
        if (ledOn) {
            ledOn = false;
            digitalWrite(LED_PIN, LOW);
        }
    }
}