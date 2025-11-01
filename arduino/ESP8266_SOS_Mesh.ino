#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <WebSocketsClient.h>
#include <espnow.h>
#include <FS.h>
#include <ArduinoJson.h>
#include <time.h>

#define WIFI_SSID "Ah"
#define WIFI_PASSWORD "12345678"

// 🔥 Firebase setup
#define FIREBASE_HOST "https://guardio-500a0-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "B15egelYIdeJDtgNpWzbz2FZiw32XLsvZMUHBScJ"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

WebSocketsClient webSocket;

float latitude = 22.443834;
float longitude = 88.416729;
String deviceID;

bool isWebSocketConnected = false;
bool hasInternet = false;
unsigned long lastInternetCheck = 0;
const unsigned long INTERNET_CHECK_INTERVAL = 30000; // Check every 30 seconds

// ESP-NOW mesh network
#define MAX_PEERS 10
#define BROADCAST_CHANNEL 1
uint8_t peerMacs[MAX_PEERS][6];
int peerCount = 0;
bool isESPNOWInit = false;

// Offline storage
const char* SOS_FILE = "/sos_queue.json";
const int MAX_QUEUE_SIZE = 50; // Max 50 pending SOS messages

// SOS Message Structure
struct SOSMessage {
  String deviceID;
  String message;
  float latitude;
  float longitude;
  unsigned long timestamp;
  bool synced;
  String id;
};

// Forward declarations
void checkInternet();
void saveSOSToQueue(SOSMessage sos);
void syncPendingSOS();
void initESPNOW();
void onESPDataRecv(uint8_t *mac, uint8_t *data, uint8_t len);
void broadcastToMesh(String jsonData);
void scanForPeers();

// 💬 WebSocket Event Handler
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("✅ WebSocket connected!");
      isWebSocketConnected = true;
      break;
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket disconnected!");
      isWebSocketConnected = false;
      break;
    case WStype_TEXT:
      Serial.printf("📩 Message from server: %s\n", payload);
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(0, INPUT_PULLUP); // Flash button

  Serial.println("\n🔌 Starting SOS Mesh Device...");

  // Initialize SPIFFS for offline storage
  if (!SPIFFS.begin()) {
    Serial.println("❌ SPIFFS Mount Failed - Formatting...");
    SPIFFS.format();
    if (SPIFFS.begin()) {
      Serial.println("✅ SPIFFS Formatted and Mounted");
    } else {
      Serial.println("❌ SPIFFS Mount Failed After Format");
    }
  } else {
    Serial.println("✅ SPIFFS Mounted Successfully");
  }

  // Initialize ESP-NOW first (works even without WiFi)
  initESPNOW();

  // Try to connect to WiFi
  Serial.println("\n🔌 Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to WiFi!");
    Serial.print("📶 IP Address: ");
    Serial.println(WiFi.localIP());
    hasInternet = true;
    
    // Firebase setup
    config.database_url = FIREBASE_HOST;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    Serial.println("✅ Firebase Initialized");

    // WebSocket setup
    webSocket.begin("192.168.83.160", 8000, "/");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    webSocket.enableHeartbeat(15000, 3000, 2);
    Serial.println("✅ WebSocket Initialized");
  } else {
    Serial.println("\n⚠️ WiFi Connection Failed - Operating in Offline Mode");
    hasInternet = false;
  }

  // Unique device ID
  deviceID = String(ESP.getChipId());
  Serial.print("🆔 Device Unique ID: ");
  Serial.println(deviceID);

  Serial.println("🔥 System Ready!");
  Serial.println("👉 Press FLASH button to send SOS!");

  // Sync any pending SOS messages from storage
  if (hasInternet) {
    delay(2000); // Wait for Firebase to be ready
    syncPendingSOS();
  }
}

void loop() {
  // Maintain WebSocket connection
  if (hasInternet) {
    webSocket.loop();
  }

  // Periodically check internet connectivity
  if (millis() - lastInternetCheck > INTERNET_CHECK_INTERVAL) {
    checkInternet();
    lastInternetCheck = millis();
    
    // If internet is restored, sync pending messages
    if (hasInternet) {
      syncPendingSOS();
    }
  }

  // Check for SOS button press
  if (digitalRead(0) == LOW) {
    sendSOS();
    delay(3000); // debounce
  }

  // Scan for ESP-NOW peers periodically (every 60 seconds)
  static unsigned long lastPeerScan = 0;
  if (millis() - lastPeerScan > 60000) {
    if (!hasInternet || peerCount < 3) { // Scan more aggressively when offline
      scanForPeers();
    }
    lastPeerScan = millis();
  }
}

void checkInternet() {
  bool previousState = hasInternet;
  
  if (WiFi.status() == WL_CONNECTED) {
    // Try to ping Firebase to verify actual internet connectivity
    WiFiClient client;
    client.setTimeout(2000); // 2 second timeout
    
    if (client.connect("guardio-500a0-default-rtdb.firebaseio.com", 443)) {
      client.stop();
      hasInternet = true;
      
      if (!previousState) {
        Serial.println("✅ Internet connection restored!");
        // Reinitialize Firebase and WebSocket
        config.database_url = FIREBASE_HOST;
        config.signer.tokens.legacy_token = FIREBASE_AUTH;
        Firebase.begin(&config, &auth);
        webSocket.begin("192.168.83.160", 8000, "/");
        webSocket.onEvent(webSocketEvent);
      }
    } else {
      hasInternet = false;
    }
  } else {
    hasInternet = false;
  }

  if (previousState && !hasInternet) {
    Serial.println("⚠️ Internet connection lost - Switching to Offline Mode");
  }
}

void sendSOS() {
  // Get timestamp (use millis since we don't have NTP by default)
  unsigned long timestamp = millis();
  
  // If WiFi is connected, try to get actual time from NTP
  static bool timeConfigured = false;
  if (WiFi.status() == WL_CONNECTED && !timeConfigured) {
    configTime(5.5 * 3600, 0, "pool.ntp.org", "time.nist.gov"); // IST timezone
    delay(2000);
    time_t now = time(nullptr);
    if (now > 1000000000) {
      timestamp = (unsigned long)now;
      timeConfigured = true;
    }
  }
  
  String timeStr = String(timestamp);

  // Create SOS message
  SOSMessage sos;
  sos.deviceID = deviceID;
  sos.message = "🚨 SOS Triggered!";
  sos.latitude = latitude;
  sos.longitude = longitude;
  sos.timestamp = timestamp;
  sos.synced = false;
  sos.id = String(timestamp) + "_" + deviceID;

  Serial.println("\n🚨 SOS TRIGGERED!");
  Serial.print("📍 Location: ");
  Serial.print(latitude, 6);
  Serial.print(", ");
  Serial.println(longitude, 6);

  bool sentToCloud = false;

  // Try to send to Firebase if online
  if (hasInternet) {
    String path = "/devices/" + deviceID + "/SOS";
    
    if (Firebase.setString(fbdo, path + "/message", sos.message) &&
        Firebase.setFloat(fbdo, path + "/latitude", sos.latitude) &&
        Firebase.setFloat(fbdo, path + "/longitude", sos.longitude) &&
        Firebase.setString(fbdo, path + "/timestamp", timeStr)) {
      Serial.println("✅ SOS Data sent to Firebase!");
      sos.synced = true;
      sentToCloud = true;
    } else {
      Serial.println("❌ Firebase Error: " + fbdo.errorReason());
      hasInternet = false; // Mark as offline if Firebase fails
    }

    // Also try WebSocket
    if (isWebSocketConnected) {
      String jsonMessage = "{\"deviceID\":\"" + sos.deviceID +
                           "\",\"message\":\"" + sos.message +
                           "\",\"latitude\":" + String(sos.latitude) +
                           ",\"longitude\":" + String(sos.longitude) +
                           ",\"timestamp\":\"" + timeStr + "\"}";
      webSocket.sendTXT(jsonMessage);
      Serial.println("📡 Sent SOS via WebSocket!");
    }
  }

  // Always broadcast to mesh network (ESP-NOW)
  String jsonData = createSOSJSON(sos);
  broadcastToMesh(jsonData);
  Serial.println("📡 Broadcasted SOS to ESP-NOW mesh!");

  // If not synced to cloud, save to queue
  if (!sentToCloud) {
    saveSOSToQueue(sos);
    Serial.println("💾 SOS saved to offline queue (will sync when online)");
  } else {
    Serial.println("✅ SOS synced to cloud!");
  }
}

String createSOSJSON(SOSMessage sos) {
  StaticJsonDocument<512> doc;
  doc["kind"] = "sos";
  doc["deviceID"] = sos.deviceID;
  doc["message"] = sos.message;
  doc["latitude"] = sos.latitude;
  doc["longitude"] = sos.longitude;
  doc["timestamp"] = sos.timestamp;
  doc["synced"] = sos.synced;
  doc["id"] = sos.id;

  String output;
  serializeJson(doc, output);
  return output;
}

void saveSOSToQueue(SOSMessage sos) {
  // Load existing queue
  DynamicJsonDocument queue(8192);
  
  if (SPIFFS.exists(SOS_FILE)) {
    File file = SPIFFS.open(SOS_FILE, "r");
    if (file) {
      deserializeJson(queue, file);
      file.close();
    }
  }

  // Add new SOS to queue
  JsonObject newSOS = queue.createNestedObject();
  newSOS["deviceID"] = sos.deviceID;
  newSOS["message"] = sos.message;
  newSOS["latitude"] = sos.latitude;
  newSOS["longitude"] = sos.longitude;
  newSOS["timestamp"] = sos.timestamp;
  newSOS["synced"] = sos.synced;
  newSOS["id"] = sos.id;

  // Limit queue size
  JsonArray array = queue.as<JsonArray>();
  if (array.size() > MAX_QUEUE_SIZE) {
    // Remove oldest entries
    for (int i = 0; i < array.size() - MAX_QUEUE_SIZE; i++) {
      array.remove(0);
    }
  }

  // Save queue back to file
  File file = SPIFFS.open(SOS_FILE, "w");
  if (file) {
    serializeJson(queue, file);
    file.close();
    Serial.println("💾 SOS queue saved (" + String(array.size()) + " messages)");
  } else {
    Serial.println("❌ Failed to save SOS queue!");
  }
}

void syncPendingSOS() {
  if (!hasInternet) return;

  if (!SPIFFS.exists(SOS_FILE)) {
    return; // No pending messages
  }

  File file = SPIFFS.open(SOS_FILE, "r");
  if (!file) {
    Serial.println("❌ Failed to open SOS queue file");
    return;
  }

  DynamicJsonDocument queue(8192);
  DeserializationError error = deserializeJson(queue, file);
  file.close();

  if (error) {
    Serial.println("❌ Failed to parse SOS queue: " + String(error.c_str()));
    return;
  }

  JsonArray array = queue.as<JsonArray>();
  if (array.size() == 0) {
    return; // Queue is empty
  }

  Serial.println("🔄 Syncing " + String(array.size()) + " pending SOS messages...");

  int syncedCount = 0;
  DynamicJsonDocument newQueue(8192);
  JsonArray newArray = newQueue.to<JsonArray>();

  // Process each SOS message
  for (JsonObject obj : array) {
    String deviceID_str = obj["deviceID"].as<String>();
    String message = obj["message"].as<String>();
    float lat = obj["latitude"].as<float>();
    float lng = obj["longitude"].as<float>();
    unsigned long ts = obj["timestamp"].as<unsigned long>();
    String id = obj["id"].as<String>();
    bool alreadySynced = obj["synced"].as<bool>();

    // Skip if already synced
    if (alreadySynced) {
      continue;
    }

    String path = "/devices/" + deviceID_str + "/SOS";
    String timeStr = String(ts);

    if (Firebase.setString(fbdo, path + "/message", message) &&
        Firebase.setFloat(fbdo, path + "/latitude", lat) &&
        Firebase.setFloat(fbdo, path + "/longitude", lng) &&
        Firebase.setString(fbdo, path + "/timestamp", timeStr)) {
      syncedCount++;
      Serial.println("✅ Synced SOS: " + id);
    } else {
      // Keep in queue if sync failed
      JsonObject item = newArray.createNestedObject();
      item["deviceID"] = deviceID_str;
      item["message"] = message;
      item["latitude"] = lat;
      item["longitude"] = lng;
      item["timestamp"] = ts;
      item["synced"] = false;
      item["id"] = id;
      Serial.println("❌ Failed to sync SOS: " + id);
    }

    delay(100); // Small delay between syncs
  }

  // Save updated queue (only unsynced messages)
  File writeFile = SPIFFS.open(SOS_FILE, "w");
  if (writeFile) {
    serializeJson(newQueue, writeFile);
    writeFile.close();
    Serial.println("✅ Synced " + String(syncedCount) + " messages. " + 
                   String(newArray.size()) + " remaining.");
  } else {
    Serial.println("❌ Failed to save updated queue!");
  }
}

void initESPNOW() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != 0) {
    Serial.println("❌ ESP-NOW Init Failed - Retrying...");
    delay(100);
    ESP.restart();
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  esp_now_register_recv_cb(onESPDataRecv);
  esp_now_register_send_cb([](uint8_t *mac_addr, uint8_t status) {
    if (status == 0) {
      Serial.println("✅ ESP-NOW message sent successfully");
    } else {
      Serial.println("❌ ESP-NOW send failed");
    }
  });

  isESPNOWInit = true;
  Serial.println("✅ ESP-NOW Initialized");

  // Add broadcast address as a peer
  uint8_t broadcastAddr[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  esp_now_add_peer(broadcastAddr, ESP_NOW_ROLE_SLAVE, BROADCAST_CHANNEL, NULL, 0);
}

void onESPDataRecv(uint8_t *mac, uint8_t *data, uint8_t len) {
  Serial.print("📥 Received ESP-NOW message from: ");
  for (int i = 0; i < 6; i++) {
    Serial.printf("%02X", mac[i]);
    if (i < 5) Serial.print(":");
  }
  Serial.println();

  // Parse received SOS message
  String receivedData = String((char*)data);
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, receivedData);

  if (error) {
    Serial.println("❌ Failed to parse ESP-NOW message");
    return;
  }

  if (doc["kind"] == "sos") {
    Serial.println("🚨 Received SOS from mesh network!");
    Serial.print("   Device: ");
    Serial.println(doc["deviceID"].as<String>());
    Serial.print("   Location: ");
    Serial.print(doc["latitude"].as<float>(), 6);
    Serial.print(", ");
    Serial.println(doc["longitude"].as<float>(), 6);

    // Check if this is our own message (prevent loops)
    String receivedID = doc["id"].as<String>();
    if (receivedID.indexOf(deviceID) != -1) {
      Serial.println("⚠️ Ignoring own message (loop prevention)");
      return;
    }

    // Create SOS message and save to queue if not synced
    SOSMessage receivedSOS;
    receivedSOS.deviceID = doc["deviceID"].as<String>();
    receivedSOS.message = doc["message"].as<String>();
    receivedSOS.latitude = doc["latitude"].as<float>();
    receivedSOS.longitude = doc["longitude"].as<float>();
    receivedSOS.timestamp = doc["timestamp"].as<unsigned long>();
    receivedSOS.synced = doc["synced"].as<bool>();
    receivedSOS.id = doc["id"].as<String>();

    // If we have internet, try to sync immediately
    if (hasInternet && !receivedSOS.synced) {
      String path = "/devices/" + receivedSOS.deviceID + "/SOS";
      String timeStr = String(receivedSOS.timestamp);

      if (Firebase.setString(fbdo, path + "/message", receivedSOS.message) &&
          Firebase.setFloat(fbdo, path + "/latitude", receivedSOS.latitude) &&
          Firebase.setFloat(fbdo, path + "/longitude", receivedSOS.longitude) &&
          Firebase.setString(fbdo, path + "/timestamp", timeStr)) {
        Serial.println("✅ Synced received SOS to Firebase!");
        receivedSOS.synced = true;
      }
    }

    // If still not synced, save to our queue
    if (!receivedSOS.synced) {
      saveSOSToQueue(receivedSOS);
    }

    // Re-broadcast to mesh (with updated sync status) to help other peers
    String jsonData = createSOSJSON(receivedSOS);
    broadcastToMesh(jsonData);
  }
}

void broadcastToMesh(String jsonData) {
  if (!isESPNOWInit) return;

  uint8_t broadcastAddr[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  
  // Send to broadcast address
  uint8_t *data = (uint8_t*)jsonData.c_str();
  size_t len = jsonData.length();
  
  if (len > 250) { // ESP-NOW max payload is ~250 bytes
    Serial.println("⚠️ Message too long for ESP-NOW, truncating...");
    len = 250;
  }

  esp_now_send(broadcastAddr, data, len);

  // Also send to known peers
  for (int i = 0; i < peerCount; i++) {
    esp_now_send(peerMacs[i], data, len);
  }
}

void scanForPeers() {
  if (peerCount >= MAX_PEERS) return;

  Serial.println("🔍 Scanning for ESP-NOW peers...");
  
  // Simple approach: when we receive a message, we add the sender as a peer
  // In a real implementation, you might use a discovery protocol
}

