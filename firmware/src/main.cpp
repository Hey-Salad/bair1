#include <Arduino.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <U8g2lib.h>
#include <LSM6DS3.h>
#include "config.h"

// ============================================================
// Bair1 MG24 Sense Firmware
// ============================================================
// Hardware: Seeed XIAO MG24 Sense + XIAO Expansion Board
// Sensors:  LSM6DS3TR-C 6-axis IMU (onboard), analog gas/AQ (A0)
// Cellular: SIM800L via UART (D6 TX, D7 RX)
// Storage:  microSD on expansion board (CS=D2) + RAM ring buffer
// Cloud:    POST JSON → sensor.heysalad.app → Vercel → Neon Postgres
// ============================================================

// --- Forward declarations ---
static void initIMU();
static void readIMU();
static void initSim800();
static void initSim800AtBaud(uint32_t baud);
static bool ensureGprs();
static bool sim800PostJson(const String &url, const String &apiKey, const String &body);
static void readCellTower();
static void sampleSensors();
static void uploadReading();
static void drainOfflineQueue();
static void storeReadingOffline(const String &json);
static String buildCloudPayload();
static void initDisplay();
static void refreshDisplay();

// --- LSM6DS3 IMU (Seeed library) ---
static LSM6DS3 myIMU(I2C_MODE, 0x6A);

// --- SIM800L state ---
static bool sim800Ready = false;
static bool sim800GprsReady = false;

// --- Cell tower location ---
struct CellTower {
  int mcc = 0, mnc = 0, lac = 0, cid = 0, rssi = 0;
};
static CellTower cellTower;
static bool cellTowerValid = false;

// --- IMU state ---
static bool imuReady = false;
struct IMUReading {
  float ax, ay, az;  // m/s^2
  float gx, gy, gz;  // deg/s
};
static IMUReading imu;

// --- Sensor reading ---
struct Reading {
  uint32_t index = 0;
  unsigned long timestampMs = 0;
  int gasRaw = 0;
  float gasVoltage = 0.0f;
  int qualityScore = 0;
  String airState = "unknown";
  int simRssi = 0;
  uint32_t freeHeap = 0;
};
static Reading latest;
static uint32_t sampleCounter = 0;
static String deviceId;

// --- Timing ---
static unsigned long lastSampleMs = 0;
static unsigned long lastUploadMs = 0;
static unsigned long lastLocationMs = 0;

// --- SD card ---
static bool sdReady = false;

// --- OLED display (expansion board) ---
// HW_I2C on Wire (D4=SDA, D5=SCL) — requires 256-byte Wire TX buffer
static U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2Hw(
    U8G2_R0, /* reset=*/ U8X8_PIN_NONE);
static U8G2_SSD1306_128X64_NONAME_F_SW_I2C u8g2SwWire1(
    U8G2_R0, /* clock=*/ PIN_WIRE_SCL1, /* data=*/ PIN_WIRE_SDA1,
    /* reset=*/ U8X8_PIN_NONE);
static U8G2 *u8g2 = nullptr;
static bool displayReady = false;
static unsigned long lastDisplayMs = 0;
static String displayStatus = "Booting...";

// --- Offline queue (RAM ring buffer) ---
struct QueueEntry {
  String json;
  bool valid = false;
};
static QueueEntry offlineQueue[MAX_STORED_READINGS];
static uint16_t queueHead = 0;
static uint16_t queueCount = 0;

// ============================================================
// Device ID from chip unique ID
// ============================================================
static String getDeviceId() {
  // EFR32MG24: read 64-bit unique ID from DEVINFO EUI64 registers
  uint32_t lo = DEVINFO->EUI64L;
  uint32_t hi = DEVINFO->EUI64H;
  char id[17];
  snprintf(id, sizeof(id), "%08lX%08lX", (unsigned long)hi, (unsigned long)lo);
  return String(id);
}

// ============================================================
// I2C helpers — Both OLED and onboard IMU share Wire (D4=SDA, D5=SCL)
// U8g2 uses HW_I2C so they coexist on the same bus
// ============================================================
static TwoWire &imuWire = Wire;

static void i2cWriteReg(uint8_t addr, uint8_t reg, uint8_t val) {
  imuWire.beginTransmission(addr);
  imuWire.write(reg);
  imuWire.write(val);
  imuWire.endTransmission();
}

static uint8_t i2cReadReg(uint8_t addr, uint8_t reg) {
  imuWire.beginTransmission(addr);
  imuWire.write(reg);
  imuWire.endTransmission(false);
  imuWire.requestFrom(addr, (uint8_t)1);
  return imuWire.available() ? imuWire.read() : 0;
}

static void i2cReadRegs(uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len) {
  imuWire.beginTransmission(addr);
  imuWire.write(reg);
  imuWire.endTransmission(false);
  imuWire.requestFrom(addr, len);
  for (uint8_t i = 0; i < len && imuWire.available(); i++) {
    buf[i] = imuWire.read();
  }
}

static bool i2cProbe(TwoWire &bus, uint8_t addr) {
  bus.beginTransmission(addr);
  bus.write(0x00);  // MG24 Wire probes more reliably with one byte queued.
  return bus.endTransmission() == 0;
}

static void scanI2CBus(TwoWire &bus, const char *name) {
  Serial.printf("[I2C] Scanning %s...\n", name);
  uint8_t count = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    if (i2cProbe(bus, addr)) {
      Serial.printf("[I2C]   Found device at 0x%02X on %s\n", addr, name);
      count++;
    }
  }
  Serial.printf("[I2C]   %u device(s) on %s\n", count, name);
}

static void probeI2CDevice(TwoWire &bus, const char *busName, uint8_t addr,
                           const char *label) {
  Serial.printf("[I2C] Probe %s 0x%02X on %s: %s\n", label, addr, busName,
                i2cProbe(bus, addr) ? "FOUND" : "missing");
}

// ============================================================
// IMU — LSM6DS3TR-C (using Seeed LSM6DS3 library)
// ============================================================
static void initIMU() {
  // Seeed library auto-handles PD5 power enable and Wire1 for MG24
  int result = myIMU.begin();
  if (result != 0) {
    Serial.printf("[IMU] Init failed — error code %d\n", result);
    imuReady = false;
    return;
  }
  imuReady = true;
  Serial.println("[IMU] LSM6DS3TR-C initialized (Wire1, Seeed library)");
}

static void readIMU() {
  if (!imuReady) return;

  imu.ax = myIMU.readFloatAccelX();
  imu.ay = myIMU.readFloatAccelY();
  imu.az = myIMU.readFloatAccelZ();
  imu.gx = myIMU.readFloatGyroX();
  imu.gy = myIMU.readFloatGyroY();
  imu.gz = myIMU.readFloatGyroZ();
}

// ============================================================
// Air quality scoring
// ============================================================
static int scoreFromGasRaw(int raw) {
  int score = map(constrain(raw, 200, 2600), 2600, 200, 0, 100);
  return constrain(score, 0, 100);
}

static String qualityLabel(int score) {
  if (score >= 80) return "Good";
  if (score >= 55) return "Moderate";
  if (score >= 30) return "Poor";
  return "Hazardous";
}

// ============================================================
// SIM800L — AT command layer
// ============================================================
static String readSim800For(uint32_t timeoutMs) {
  unsigned long start = millis();
  String response;
  while (millis() - start < timeoutMs) {
    while (Serial1.available()) {
      response += (char)Serial1.read();
    }
    delay(10);
  }
  if (!response.isEmpty()) {
    Serial.print("[SIM800] ");
    Serial.println(response);
  }
  return response;
}

static bool sim800WaitFor(const String &needle, uint32_t timeoutMs, String *out = nullptr) {
  unsigned long start = millis();
  String response;
  while (millis() - start < timeoutMs) {
    while (Serial1.available()) {
      response += (char)Serial1.read();
      if (response.indexOf(needle) >= 0) {
        if (out) *out = response;
        Serial.print("[SIM800] ");
        Serial.println(response);
        return true;
      }
      if (response.indexOf("ERROR") >= 0) {
        if (out) *out = response;
        Serial.print("[SIM800] ");
        Serial.println(response);
        return false;
      }
    }
    delay(10);
  }
  if (out) *out = response;
  if (!response.isEmpty()) {
    Serial.print("[SIM800] ");
    Serial.println(response);
  }
  return false;
}

static bool sim800Command(const String &cmd, const String &expect = "OK",
                           uint32_t timeoutMs = 2000, String *out = nullptr) {
  while (Serial1.available()) Serial1.read();
  Serial.print("[SIM800] > ");
  Serial.println(cmd);
  Serial1.print(cmd);
  Serial1.print("\r\n");
  return sim800WaitFor(expect, timeoutMs, out);
}

static int parseSim800Rssi(const String &response) {
  int marker = response.indexOf("+CSQ:");
  if (marker < 0) return 0;
  int comma = response.indexOf(',', marker);
  if (comma < 0) return 0;
  int raw = response.substring(marker + 5, comma).toInt();
  if (raw == 99) return 0;
  return -113 + (2 * raw);
}

static void powerPulseSim800() {
  if (SIM800_PWRKEY_PIN < 0) return;
  pinMode(SIM800_PWRKEY_PIN, OUTPUT);
  digitalWrite(SIM800_PWRKEY_PIN, LOW);
  delay(1200);
  digitalWrite(SIM800_PWRKEY_PIN, HIGH);
  delay(4000);
}

static void initSim800() {
  if (SIM800_ENABLED != 1) {
    Serial.println("[SIM800] Disabled in config");
    return;
  }

  powerPulseSim800();
  bool ok = false;
  uint32_t activeBaud = SIM800_BAUD;
  const uint32_t bauds[] = {SIM800_BAUD, 9600, 115200, 19200, 38400, 57600};

  uint32_t lastTriedBaud = 0;
  for (uint32_t baud : bauds) {
    if (baud == lastTriedBaud) continue;
    lastTriedBaud = baud;
    Serial1.end();
    delay(150);
    Serial1.begin(baud);
    delay(600);
    Serial.printf("[SIM800] UART on Serial1 D6(TX)->RXD D7(RX)<-TXD baud=%lu\n",
                  (unsigned long)baud);

    for (uint8_t attempt = 0; attempt < 3; ++attempt) {
      if (sim800Command("AT", "OK", 1000)) {
        ok = true;
        activeBaud = baud;
        break;
      }
      delay(300);
    }
    if (ok) break;
  }

  if (!ok) {
    Serial.println("[SIM800] No AT response on tested bauds — check TX/RX crossing, common ground, and 4V supply");
    return;
  }

  sim800Command("ATE0");
  if (String(SIM800_PIN).length() > 0) {
    sim800Command("AT+CPIN=\"" + String(SIM800_PIN) + "\"", "OK", 5000);
  }

  String csq;
  sim800Command("AT+CSQ", "OK", 2000, &csq);
  latest.simRssi = parseSim800Rssi(csq);
  sim800Ready = true;
  Serial.printf("[SIM800] Ready at %lu baud, RSSI=%d dBm\n",
                (unsigned long)activeBaud, latest.simRssi);
}

static bool tryGprsWithApn(const char *apn, const char *user, const char *pass) {
  Serial.printf("[SIM800] Trying APN: %s\n", apn);
  sim800Command("AT+SAPBR=0,1", "OK", 3000);
  sim800Command("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 3000);
  sim800Command("AT+SAPBR=3,1,\"APN\",\"" + String(apn) + "\"", "OK", 3000);
  if (strlen(user) > 0)
    sim800Command("AT+SAPBR=3,1,\"USER\",\"" + String(user) + "\"", "OK", 3000);
  if (strlen(pass) > 0)
    sim800Command("AT+SAPBR=3,1,\"PWD\",\"" + String(pass) + "\"", "OK", 3000);

  if (!sim800Command("AT+SAPBR=1,1", "OK", 25000)) return false;

  String response;
  sim800Command("AT+SAPBR=2,1", "OK", 5000, &response);
  bool gotIp = response.indexOf("0.0.0.0") < 0;
  if (gotIp) {
    Serial.printf("[SIM800] GPRS connected with APN: %s\n", apn);
  }
  return gotIp;
}

static bool ensureGprs() {
  if (!sim800Ready) {
    initSim800();
    if (!sim800Ready) return false;
  }
  if (sim800GprsReady) return true;

  sim800Command("AT+CPIN?", "READY", 5000);
  sim800Command("AT+CREG?", "OK", 3000);
  sim800Command("AT+CGATT=1", "OK", 10000);

  // Try configured APN first, then common fallbacks
  const char *apns[] = {
    SIM800_APN,            // general.t-mobile.uk
    "everywhere",          // EE UK (T-Mobile UK merged into EE)
    "fast.t-mobile.com",   // T-Mobile US
    "internet",            // Generic fallback
    "",                    // Empty APN (some roaming SIMs)
  };

  for (const char *apn : apns) {
    if (tryGprsWithApn(apn, SIM800_USER, SIM800_PASS)) {
      sim800GprsReady = true;
      return true;
    }
  }

  Serial.println("[SIM800] GPRS failed on all APNs");
  sim800GprsReady = false;
  return false;
}

static bool sim800PostJson(const String &url, const String &apiKey, const String &body) {
  if (!ensureGprs()) return false;
  if (apiKey.isEmpty()) {
    Serial.println("[SIM800] Missing API key");
    return false;
  }

  sim800Command("AT+HTTPTERM", "OK", 1000);
  if (!sim800Command("AT+HTTPINIT", "OK", 5000)) return false;
  if (!sim800Command("AT+HTTPPARA=\"CID\",1", "OK", 3000)) return false;

  bool https = url.startsWith("https://");
  sim800Command(https ? "AT+HTTPSSL=1" : "AT+HTTPSSL=0", "OK", 3000);

  if (!sim800Command("AT+HTTPPARA=\"URL\",\"" + url + "\"", "OK", 5000)) return false;
  sim800Command("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 3000);
  if (!sim800Command("AT+HTTPPARA=\"USERDATA\",\"x-api-key: " + apiKey + "\"", "OK", 3000))
    return false;

  while (Serial1.available()) Serial1.read();
  Serial1.print("AT+HTTPDATA=");
  Serial1.print(body.length());
  Serial1.print(",10000\r\n");
  if (!sim800WaitFor("DOWNLOAD", 5000)) return false;
  Serial1.print(body);
  if (!sim800WaitFor("OK", 12000)) return false;

  Serial1.print("AT+HTTPACTION=1\r\n");
  String actionResp;
  if (!sim800WaitFor("+HTTPACTION:", 65000, &actionResp)) {
    sim800Command("AT+HTTPTERM", "OK", 1000);
    return false;
  }
  // Read remaining data after +HTTPACTION: to capture status code
  String extra = readSim800For(1000);
  actionResp += extra;

  sim800Command("AT+HTTPREAD", "OK", 10000);
  sim800Command("AT+HTTPTERM", "OK", 3000);

  bool success = actionResp.indexOf(",200,") >= 0 || actionResp.indexOf(",201,") >= 0;
  Serial.printf("[CLOUD] POST %s\n", success ? "OK" : "FAILED");
  return success;
}

// ============================================================
// Cell tower location
// ============================================================
static void readCellTower() {
  if (!sim800Ready) return;

  // MCC/MNC from operator — must request numeric format (mode 2)
  sim800Command("AT+COPS=3,2", "OK", 2000);  // Set numeric format
  String copsResp;
  if (sim800Command("AT+COPS?", "OK", 3000, &copsResp)) {
    // Response: +COPS: 0,2,"23430"  (MCC=234, MNC=30)
    int idx = copsResp.indexOf("+COPS:");
    if (idx >= 0) {
      int q1 = copsResp.indexOf('"', idx);
      int q2 = copsResp.indexOf('"', q1 + 1);
      if (q1 >= 0 && q2 > q1) {
        String op = copsResp.substring(q1 + 1, q2);
        if (op.length() >= 5) {
          cellTower.mcc = op.substring(0, 3).toInt();
          cellTower.mnc = op.substring(3).toInt();
        }
      }
    }
  }

  // LAC/CID from verbose CREG
  sim800Command("AT+CREG=2", "OK", 2000);
  String cregResp;
  if (sim800Command("AT+CREG?", "OK", 3000, &cregResp)) {
    int idx = cregResp.indexOf("+CREG:");
    if (idx >= 0) {
      int q1 = cregResp.indexOf('"', idx);
      int q2 = cregResp.indexOf('"', q1 + 1);
      int q3 = cregResp.indexOf('"', q2 + 1);
      int q4 = cregResp.indexOf('"', q3 + 1);
      if (q1 >= 0 && q4 > q3) {
        cellTower.lac = (int)strtol(cregResp.substring(q1 + 1, q2).c_str(), nullptr, 16);
        cellTower.cid = (int)strtol(cregResp.substring(q3 + 1, q4).c_str(), nullptr, 16);
      }
    }
  }
  sim800Command("AT+CREG=0", "OK", 2000);

  // Signal strength
  String csqResp;
  sim800Command("AT+CSQ", "OK", 2000, &csqResp);
  cellTower.rssi = parseSim800Rssi(csqResp);
  latest.simRssi = cellTower.rssi;

  cellTowerValid = (cellTower.lac > 0 && cellTower.cid > 0);
  Serial.printf("[LOC] Cell: MCC=%d MNC=%d LAC=%d CID=%d RSSI=%d\n",
                cellTower.mcc, cellTower.mnc, cellTower.lac, cellTower.cid, cellTower.rssi);
}

// ============================================================
// Sensor sampling
// ============================================================
static void sampleSensors() {
  latest.index = ++sampleCounter;
  latest.timestampMs = millis();
  latest.gasRaw = analogRead(PIN_ADC);
  latest.gasVoltage = latest.gasRaw * (3.3f / 4095.0f);
  latest.qualityScore = scoreFromGasRaw(latest.gasRaw);
  latest.airState = qualityLabel(latest.qualityScore);

  readIMU();

  Serial.printf("[SAMPLE] #%lu gas=%d (%.3fV) score=%d [%s] | IMU ax=%.2f ay=%.2f az=%.2f gx=%.1f gy=%.1f gz=%.1f\n",
                (unsigned long)latest.index, latest.gasRaw, latest.gasVoltage,
                latest.qualityScore, latest.airState.c_str(),
                imu.ax, imu.ay, imu.az, imu.gx, imu.gy, imu.gz);
}

// ============================================================
// Build JSON payload for cloud
// ============================================================
static String buildCloudPayload() {
  JsonDocument doc;
  doc["deviceId"] = deviceId;
  doc["deviceName"] = DEVICE_DISPLAY_NAME;
  doc["version"] = DEVICE_VERSION;
  doc["platform"] = DEVICE_PLATFORM;
  doc["family"] = DEVICE_FAMILY;
  doc["uptimeMs"] = latest.timestampMs;
  doc["sample"] = latest.index;
  doc["transport"] = "sim800l";

  // Air quality
  JsonObject air = doc["air"].to<JsonObject>();
  air["score"] = latest.qualityScore;
  air["state"] = latest.airState;

  // Raw sensor data
  JsonObject sensors = doc["sensors"].to<JsonObject>();
  sensors["gasRaw"] = latest.gasRaw;
  sensors["gasVoltage"] = serialized(String(latest.gasVoltage, 3));

  // IMU data
  if (imuReady) {
    JsonObject motion = doc["motion"].to<JsonObject>();
    JsonObject accel = motion["accel"].to<JsonObject>();
    accel["x"] = serialized(String(imu.ax, 3));
    accel["y"] = serialized(String(imu.ay, 3));
    accel["z"] = serialized(String(imu.az, 3));
    JsonObject gyro = motion["gyro"].to<JsonObject>();
    gyro["x"] = serialized(String(imu.gx, 2));
    gyro["y"] = serialized(String(imu.gy, 2));
    gyro["z"] = serialized(String(imu.gz, 2));
  }

  // Cell tower for geolocation
  if (cellTowerValid) {
    JsonObject cell = doc["cellTower"].to<JsonObject>();
    cell["mcc"] = cellTower.mcc;
    cell["mnc"] = cellTower.mnc;
    cell["lac"] = cellTower.lac;
    cell["cid"] = cellTower.cid;
    cell["rssi"] = cellTower.rssi;
  }

  // Connectivity info
  JsonObject cellular = doc["cellular"].to<JsonObject>();
  cellular["ready"] = sim800Ready;
  cellular["gprs"] = sim800GprsReady;
  cellular["rssi"] = latest.simRssi;

  // System
  doc["imu"] = imuReady;
  doc["sd"] = sdReady;
  doc["offlineQueued"] = queueCount;

  String out;
  serializeJson(doc, out);
  return out;
}

// ============================================================
// Offline storage — RAM ring buffer + SD card
// ============================================================
static void storeReadingOffline(const String &json) {
  // Store in RAM ring buffer
  offlineQueue[queueHead].json = json;
  offlineQueue[queueHead].valid = true;
  queueHead = (queueHead + 1) % MAX_STORED_READINGS;
  if (queueCount < MAX_STORED_READINGS) queueCount++;

  Serial.printf("[STORE] Queued reading (RAM: %u/%d)\n", queueCount, MAX_STORED_READINGS);

  // Also append to SD card if available
  if (sdReady) {
    File f = SD.open(SD_QUEUE_FILE, FILE_WRITE);
    if (f) {
      f.println(json);
      f.close();
      Serial.println("[STORE] Written to SD");
    }
  }
}

static void drainOfflineQueue() {
  if (queueCount == 0) return;
  Serial.printf("[DRAIN] Attempting to upload %u queued readings\n", queueCount);

  // Drain RAM queue
  uint16_t startIdx = (queueHead - queueCount + MAX_STORED_READINGS) % MAX_STORED_READINGS;
  uint16_t uploaded = 0;

  for (uint16_t i = 0; i < queueCount; i++) {
    uint16_t idx = (startIdx + i) % MAX_STORED_READINGS;
    if (!offlineQueue[idx].valid) continue;

    if (sim800PostJson(BEAR_ONE_API_URL, BEAR_ONE_API_KEY, offlineQueue[idx].json)) {
      offlineQueue[idx].valid = false;
      offlineQueue[idx].json = "";
      uploaded++;
      Serial.printf("[DRAIN] Uploaded %u/%u\n", uploaded, queueCount);
    } else {
      Serial.println("[DRAIN] Upload failed, stopping drain");
      break;
    }
    delay(2000);  // Don't hammer the modem
  }

  queueCount -= uploaded;
  if (queueCount == 0) queueHead = 0;

  // If all RAM drained and SD has data, try SD too
  if (uploaded > 0 && sdReady && SD.exists(SD_QUEUE_FILE)) {
    File f = SD.open(SD_QUEUE_FILE, FILE_READ);
    if (f) {
      String line;
      bool sdDrainOk = true;
      while (f.available() && sdDrainOk) {
        line = f.readStringUntil('\n');
        line.trim();
        if (line.isEmpty()) continue;
        if (!sim800PostJson(BEAR_ONE_API_URL, BEAR_ONE_API_KEY, line)) {
          sdDrainOk = false;
        }
        delay(2000);
      }
      f.close();
      if (sdDrainOk) {
        SD.remove(SD_QUEUE_FILE);
        Serial.println("[DRAIN] SD queue cleared");
      }
    }
  }

  Serial.printf("[DRAIN] Done. Remaining in RAM: %u\n", queueCount);
}

// ============================================================
// Upload current reading (or store offline)
// ============================================================
static void uploadReading() {
  String payload = buildCloudPayload();
  Serial.printf("[CLOUD] Payload (%u bytes): %s\n", payload.length(), payload.c_str());

  // Always log to SD if available
  if (sdReady) {
    File f = SD.open(SD_LOG_FILE, FILE_WRITE);
    if (f) {
      f.println(payload);
      f.close();
    }
  }

  // Try to upload
  if (sim800Ready && sim800PostJson(BEAR_ONE_API_URL, BEAR_ONE_API_KEY, payload)) {
    Serial.println("[CLOUD] Reading uploaded successfully");
    // If we uploaded successfully, try draining any offline queue
    if (queueCount > 0) {
      drainOfflineQueue();
    }
  } else {
    Serial.println("[CLOUD] Upload failed — storing offline");
    storeReadingOffline(payload);
  }
}

// ============================================================
// SD card init
// ============================================================
static void initSD() {
  Serial.println("[SD] Initializing (CS=D2)...");
  if (SD.begin(PIN_SD_CS)) {
    sdReady = true;
    Serial.println("[SD] Card mounted OK");
  } else {
    sdReady = false;
    Serial.println("[SD] No card or init failed — using RAM buffer only");
  }
}

// ============================================================
// OLED display
// ============================================================
static void initDisplay() {
  if (i2cProbe(Wire, OLED_ADDRESS)) {
    u8g2 = &u8g2Hw;
    Serial.printf("[OLED] Found display at 0x%02X on Wire (D4 SDA, D5 SCL)\n",
                  OLED_ADDRESS);
  } else if (i2cProbe(Wire1, OLED_ADDRESS)) {
    u8g2 = &u8g2SwWire1;
    Serial.printf("[OLED] Found display at 0x%02X on Wire1 (D14 SDA, D13 SCL)\n",
                  OLED_ADDRESS);
  } else {
    u8g2 = nullptr;
    displayReady = false;
    Serial.printf("[OLED] No display found at 0x%02X on Wire or Wire1 — continuing headless\n",
                  OLED_ADDRESS);
    return;
  }

  u8g2->setI2CAddress(OLED_ADDRESS * 2);  // U8g2 uses 8-bit I2C address
  u8g2->begin();
  u8g2->setContrast(200);
  u8g2->setPowerSave(0);  // Ensure display is on
  displayReady = true;

  // Show boot splash
  u8g2->clearBuffer();
  u8g2->setFont(u8g2_font_helvB12_tr);
  u8g2->drawStr(20, 28, "BAIR1");
  u8g2->setFont(u8g2_font_helvR08_tr);
  u8g2->drawStr(16, 44, "MG24 Sense v1.0");
  u8g2->drawStr(28, 58, "Initializing...");
  u8g2->sendBuffer();
  Serial.println("[OLED] Display initialized");
}

static void refreshDisplay() {
  if (!displayReady) return;

  u8g2->clearBuffer();

  // --- Row 1: Title bar ---
  u8g2->setFont(u8g2_font_helvB08_tr);
  u8g2->drawStr(0, 10, "BAIR1");

  // Signal bars indicator (top right)
  int bars = 0;
  if (sim800Ready) {
    int rssi = latest.simRssi;
    if (rssi < -100) bars = 1;
    else if (rssi < -85) bars = 2;
    else if (rssi < -70) bars = 3;
    else bars = 4;
  }
  for (int i = 0; i < 4; i++) {
    int x = 108 + i * 5;
    int h = 3 + i * 2;
    if (i < bars) {
      u8g2->drawBox(x, 10 - h, 4, h);
    } else {
      u8g2->drawFrame(x, 10 - h, 4, h);
    }
  }

  // --- Row 2: Air quality (big) ---
  u8g2->setFont(u8g2_font_helvB14_tr);
  char scoreBuf[8];
  snprintf(scoreBuf, sizeof(scoreBuf), "%d", latest.qualityScore);
  u8g2->drawStr(0, 30, scoreBuf);

  u8g2->setFont(u8g2_font_helvR08_tr);
  u8g2->drawStr(30, 24, latest.airState.c_str());

  // Gas voltage
  char gasBuf[16];
  snprintf(gasBuf, sizeof(gasBuf), "%.2fV", latest.gasVoltage);
  u8g2->drawStr(30, 34, gasBuf);

  // --- Row 3: IMU acceleration ---
  u8g2->setFont(u8g2_font_5x7_tr);
  if (imuReady) {
    char imuBuf[40];
    snprintf(imuBuf, sizeof(imuBuf), "X%.1f Y%.1f Z%.1f", imu.ax, imu.ay, imu.az);
    u8g2->drawStr(0, 46, imuBuf);
  } else {
    u8g2->drawStr(0, 46, "IMU: --");
  }

  // --- Row 4: Status bar ---
  u8g2->setFont(u8g2_font_5x7_tr);
  char statusBuf[32];
  snprintf(statusBuf, sizeof(statusBuf), "%s Q:%u #%lu",
           sim800Ready ? (sim800GprsReady ? "GPRS" : "SIM") : "NOSIM",
           queueCount,
           (unsigned long)latest.index);
  u8g2->drawStr(0, 58, statusBuf);

  // SD indicator
  if (sdReady) {
    u8g2->drawStr(108, 58, "SD");
  }

  // Cell tower location indicator
  if (cellTowerValid) {
    u8g2->drawStr(96, 58, "LOC");
  }

  u8g2->sendBuffer();
}

// ============================================================
// Setup
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println();
  Serial.println("========================================");
  Serial.println("  Bair1 MG24 Sense — Air Quality Node");
  Serial.println("  " DEVICE_VERSION);
  Serial.println("========================================");

  // Device ID
  deviceId = getDeviceId();
  Serial.printf("[BOOT] Device ID: %s\n", deviceId.c_str());

  // I2C bus — Wire (D4=SDA, D5=SCL)
  Wire.begin();
  Wire1.begin();
  delay(100);
  probeI2CDevice(Wire, "Wire D4/D5", OLED_ADDRESS, "OLED");
  probeI2CDevice(Wire, "Wire D4/D5", 0x3D, "OLED alt");

  // IMU — only available on MG24 Sense (not regular MG24)
  initIMU();
  probeI2CDevice(Wire1, "Wire1 D14/D13", OLED_ADDRESS, "OLED");
  probeI2CDevice(Wire1, "Wire1 D14/D13", 0x3D, "OLED alt");
  probeI2CDevice(Wire1, "Wire1 D14/D13", IMU_I2C_ADDR, "IMU");

  // OLED display, if attached on either available I2C bus.
  initDisplay();

  // SD card
  initSD();

  // SIM800L
  initSim800();

  // Initial cell tower scan
  if (sim800Ready) {
    readCellTower();
  }

  // First sample
  sampleSensors();

  Serial.println("[BOOT] Setup complete");
  Serial.printf("[BOOT] IMU=%s SD=%s SIM800=%s GPRS=%s CellLoc=%s OLED=%s\n",
                imuReady ? "OK" : "NO",
                sdReady ? "OK" : "NO",
                sim800Ready ? "OK" : "NO",
                sim800GprsReady ? "OK" : "NO",
                cellTowerValid ? "OK" : "NO",
                displayReady ? "OK" : "NO");
  Serial.printf("[BOOT] Upload interval: %ds, Sample interval: %ds\n",
                CLOUD_UPLOAD_INTERVAL_MS / 1000, SAMPLE_INTERVAL_MS / 1000);

  // Show first reading on display
  refreshDisplay();
}

// ============================================================
// Main loop
// ============================================================
void loop() {
  unsigned long now = millis();

  // Sample sensors periodically
  if (now - lastSampleMs >= SAMPLE_INTERVAL_MS) {
    lastSampleMs = now;
    sampleSensors();
  }

  // Update cell tower location periodically
  if (now - lastLocationMs >= LOCATION_SCAN_INTERVAL_MS) {
    lastLocationMs = now;
    if (sim800Ready) {
      readCellTower();

      // Refresh signal strength
      String csq;
      sim800Command("AT+CSQ", "OK", 2000, &csq);
      latest.simRssi = parseSim800Rssi(csq);
    }
  }

  // Refresh OLED display
  if (now - lastDisplayMs >= DISPLAY_REFRESH_MS) {
    lastDisplayMs = now;
    refreshDisplay();
  }

  // Upload to cloud periodically
  if (now - lastUploadMs >= CLOUD_UPLOAD_INTERVAL_MS) {
    lastUploadMs = now;
    uploadReading();
  }

  delay(100);
}
