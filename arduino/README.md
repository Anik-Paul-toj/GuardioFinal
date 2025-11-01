# ESP8266 SOS Mesh Network with Offline Support

This Arduino code implements a resilient SOS system that works both online and offline, using ESP-NOW mesh networking to forward SOS messages between devices.

## Features

✅ **Offline Storage**: SOS messages are stored in SPIFFS when internet is unavailable  
✅ **ESP-NOW Mesh Networking**: Devices forward SOS messages to nearby peers  
✅ **Automatic Sync**: When any device comes online, it syncs all pending messages to Firebase  
✅ **Internet Connectivity Check**: Automatically detects when internet is available  
✅ **Message Queue Management**: Handles up to 50 pending SOS messages  
✅ **Loop Prevention**: Prevents message loops in mesh network  

## How It Works

### Online Mode (Internet Available)
1. When SOS is triggered, it sends directly to Firebase
2. Also broadcasts via WebSocket to local server
3. If Firebase fails, message is stored offline and broadcast to mesh

### Offline Mode (No Internet)
1. SOS message is stored in SPIFFS storage
2. Message is broadcast via ESP-NOW to nearby devices
3. Other devices receive and store the message
4. When any device comes online, it syncs all pending messages to Firebase

### Mesh Forwarding
- ESP-NOW broadcasts to all nearby ESP8266 devices
- Each device forwards received messages to other peers
- Messages include sync status to avoid duplicate uploads
- Loop prevention ensures messages aren't endlessly forwarded

## Required Libraries

Install these libraries via Arduino Library Manager:

1. **Firebase ESP8266** by Mobizt
   - Library: `Firebase ESP8266 Client`
   - Install: `Tools > Manage Libraries > Search "Firebase ESP8266"`

2. **ArduinoJson** by Benoit Blanchon
   - Library: `ArduinoJson`
   - Install: `Tools > Manage Libraries > Search "ArduinoJson"`

3. **WebSockets** by Markus Sattler
   - Library: `WebSockets`
   - Install: `Tools > Manage Libraries > Search "WebSockets"`

4. **ESP8266WiFi** (built-in)
   - Already included with ESP8266 board support

5. **FS (SPIFFS)** (built-in)
   - Already included with ESP8266 board support

6. **espnow** (built-in)
   - Already included with ESP8266 board support

## Configuration

Before uploading, update these settings in the code:

```cpp
#define WIFI_SSID "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"

#define FIREBASE_HOST "https://your-project.firebaseio.com/"
#define FIREBASE_AUTH "YourFirebaseAuthToken"

// WebSocket server IP (your local server)
webSocket.begin("192.168.83.160", 8000, "/");
```

## Upload Settings

1. **Board**: `NodeMCU 1.0 (ESP-12E Module)`
2. **Flash Size**: `4MB (FS:2MB OTA:~1019KB)`
3. **SPIFFS**: Upload SPIFFS data (via Tools > ESP8266 Sketch Data Upload)
   - Or format via code on first run

## File System Setup

The code uses SPIFFS to store offline SOS messages. The file system is automatically formatted if it fails to mount. No manual setup required.

## Serial Monitor Output

The code provides detailed logging:

- `✅` - Success indicators
- `❌` - Error indicators  
- `⚠️` - Warning indicators
- `📡` - Network activity
- `💾` - Storage operations
- `🔄` - Sync operations

## Testing Offline Mode

1. Upload the code with WiFi credentials
2. Once connected, test SOS button
3. Disconnect WiFi router or disable internet
4. Trigger SOS - should store locally and broadcast to mesh
5. Reconnect internet - should auto-sync pending messages

## Mesh Network Range

ESP-NOW typically works within:
- **Indoors**: 20-50 meters (depending on walls)
- **Outdoors**: 50-200 meters (line of sight)

## Troubleshooting

### SPIFFS Mount Failed
- Code will auto-format on first run
- Ensure board supports SPIFFS (ESP8266 with 4MB+ flash)

### ESP-NOW Not Working
- Ensure all devices are ESP8266
- Check WiFi mode is set to `WIFI_STA`
- Verify ESP-NOW initialization succeeds

### Messages Not Syncing
- Check Firebase credentials
- Verify internet connectivity with `checkInternet()`
- Check Serial Monitor for error messages

### Queue Getting Full
- Increase `MAX_QUEUE_SIZE` if needed (default: 50)
- Older messages are automatically removed when queue is full

## App Integration

The React Native app reads SOS messages from Firebase. When devices sync pending messages:

1. Device comes online
2. Reads offline queue from SPIFFS
3. Uploads all pending SOS messages to Firebase
4. App receives updates via Firebase listeners
5. Shows offline messages even if originally sent offline

## Network Architecture

```
[ESP8266 Device 1] --ESP-NOW--> [ESP8266 Device 2] --ESP-NOW--> [ESP8266 Device 3]
       |                              |                              |
       |                              |                              |
       v                              v                              v
   [Firebase] <---Internet--- [Firebase] <---Internet--- [Firebase]
       |                              |                              |
       v                              v                              v
   [Mobile App]                   [Mobile App]                   [Mobile App]
```

Each device can work independently:
- **Online**: Direct to Firebase
- **Offline**: ESP-NOW mesh → Store → Sync when online

