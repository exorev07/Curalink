# Hardware Setup

## 🛠️ Components Required
- ESP8266 NodeMCU
- MLX90614 IR Temperature Sensor
- FSR (Force Sensitive Resistor)
- RC522 RFID Reader Module
- 16x2 I2C LCD Display
- LED indicator
- Push button
- Connecting wires
- Breadboard/PCB

## 📌 Pin Configuration

### RFID RC522
- SS_PIN:  D8
- RST_PIN: D3
- SCK:     D5
- MISO:    D6
- MOSI:    D7

### LCD I2C
- SDA: D2
- SCL: D1

### Other Components
- FSR: A0 (Analog Input)
- Button: D4
- LED: D0

## ⚡ Power Requirements
- 5V for MLX90614 and RC522
- 3.3V for ESP8266 and LCD
- Common ground for all components

## 🔧 Assembly Steps
1. Connect all components according to the pin configuration
2. Double-check ground and power connections
3. Verify I2C address for LCD (default: 0x27)
4. Ensure proper RFID antenna placement
5. Test power supply stability

## 📊 Calibration
- FSR Threshold: 50 (adjustable in code)
- Temperature Threshold: 32°C (adjustable in code)
- Card Read Distance: ~3cm optimal

## 🚨 Troubleshooting
1. If MLX90614 fails to initialize:
   - Check I2C connections
   - Verify power supply stability
   
2. If RFID reader isn't detecting:
   - Check SS and RST pin connections
   - Verify SPI bus connections
   
3. If LCD shows garbled text:
   - Verify I2C address
   - Check power supply voltage
