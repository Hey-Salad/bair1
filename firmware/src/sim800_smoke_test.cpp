#include <Arduino.h>

// SIM800L Smoke Test for XIAO MG24
// Tests UART communication on Serial1 (D6 TX, D7 RX)

static String readFor(uint32_t timeoutMs) {
  unsigned long start = millis();
  String out;
  while (millis() - start < timeoutMs) {
    while (Serial1.available()) {
      out += (char)Serial1.read();
    }
    delay(10);
  }
  out.trim();
  return out;
}

static bool tryBaud(uint32_t baud) {
  Serial1.end();
  delay(150);
  Serial1.begin(baud);
  delay(250);
  while (Serial1.available()) Serial1.read();

  for (uint8_t attempt = 0; attempt < 3; ++attempt) {
    Serial1.print("AT\r\n");
    String response = readFor(900);
    Serial.printf("  attempt %u: %s\n", attempt + 1,
                  response.isEmpty() ? "<none>" : response.c_str());
    if (response.indexOf("OK") >= 0) {
      Serial1.print("ATE0\r\n");
      readFor(500);
      Serial1.print("AT+CSQ\r\n");
      String csq = readFor(1200);
      Serial.printf("  CSQ: %s\n", csq.isEmpty() ? "<none>" : csq.c_str());
      Serial1.print("AT+CPIN?\r\n");
      String cpin = readFor(1200);
      Serial.printf("  CPIN: %s\n", cpin.isEmpty() ? "<none>" : cpin.c_str());
      return true;
    }
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println();
  Serial.println("=== SIM800L Smoke Test (XIAO MG24) ===");
  Serial.println("Testing Serial1 (D6=TX, D7=RX)");
  Serial.println();
  Serial.println("Wiring:");
  Serial.println("  MG24 D6 (TX) --> SIM800L RXD (via voltage divider if needed)");
  Serial.println("  MG24 D7 (RX) <-- SIM800L TXD");
  Serial.println("  GND          <-> GND (common ground!)");
  Serial.println("  SIM800L VCC  <-- 3.7-4.2V (separate supply, 2A capable)");
  Serial.println();

  const uint32_t bauds[] = {9600, 19200, 38400, 57600, 115200};
  bool found = false;

  for (uint32_t baud : bauds) {
    Serial.printf("Trying baud %lu...\n", (unsigned long)baud);
    if (tryBaud(baud)) {
      Serial.printf("\nSIM800_OK baud=%lu\n", (unsigned long)baud);
      found = true;
      break;
    }
  }

  if (!found) {
    Serial.println("\nSIM800_NOT_FOUND");
    Serial.println("Check: power supply, common ground, wiring, SIM card inserted");
  }
}

void loop() {
  // Pass-through mode: type AT commands in serial monitor
  while (Serial.available()) {
    Serial1.write(Serial.read());
  }
  while (Serial1.available()) {
    Serial.write(Serial1.read());
  }
}
