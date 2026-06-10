# AETHON ESP32 RFID API Documentation

This document describes how to integrate an ESP32 microcontroller equipped with an RC522 RFID reader with the AETHON backend.

## Endpoint: Record Attendance Scan
**URL:** `POST /api/attendance/scan`
**Content-Type:** `application/json`

### Description
Validates an RFID tag UID against the student database, records their attendance, and automatically calculates reward eligibility.

### Request Payload
```json
{
  "uid": "A1B2C3D4"
}
```

### Success Response (HTTP 200)
```json
{
  "message": "Attendance recorded successfully",
  "status": "success",
  "student_id": 1,
  "points_awarded": 5,
  "eligible_for_rewards": true
}
```

### Duplicate Scan Response (HTTP 200)
If the student has already scanned in today:
```json
{
  "message": "Attendance already recorded for today",
  "status": "duplicate"
}
```

### Error Responses
**HTTP 404 (Not Found)**
```json
{ "error": "Student not found for this RFID" }
```

**HTTP 400 (Bad Request)**
```json
{ "error": "UID is required" }
```

---

## ESP32 Arduino/C++ Integration Example

Required Libraries:
- `WiFi.h`
- `HTTPClient.h`
- `SPI.h`
- `MFRC522.h`

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/attendance/scan";

#define RST_PIN 22
#define SS_PIN 21

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" WiFi Connected.");

  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("Place RFID Card to scan...");
}

void loop() {
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  String uidStr = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uidStr += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uidStr += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  
  Serial.println("Scanned UID: " + uidStr);
  sendToServer(uidStr);
  
  delay(2000); // Prevent spamming
}

void sendToServer(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"uid\":\"" + uid + "\"}";
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}
```
