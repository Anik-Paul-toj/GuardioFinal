# Offline SOS Mesh Network Implementation

This document explains how the offline SOS mesh network system works with ESP8266 devices and the React Native app.

## System Overview

The implementation provides a resilient SOS system that works in three modes:
1. **Online Mode**: Direct Firebase sync
2. **Offline Mode**: Local storage + ESP-NOW mesh forwarding
3. **Hybrid Mode**: Works in both online and offline simultaneously

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ESP8266 Device Flow                      │
└─────────────────────────────────────────────────────────────┘

[SOS Button Pressed]
        │
        ├─► [Internet Available?]
        │       │
        │       ├─ YES ──► [Send to Firebase] ──► [Success?]
        │       │               │                        │
        │       │               └─ NO ──► [Save to Queue] ──► [ESP-NOW Broadcast]
        │       │                                                      │
        │       └─ NO ──► [Save to SPIFFS Queue] ────► [ESP-NOW Broadcast]
        │                                                      │
        └─────────────────────────────────────────────────────────┘
                            │
                    [ESP-NOW Mesh Network]
                            │
        ┌───────────────────┴───────────────────┐
        │                                         │
   [Nearby Device]                        [Nearby Device]
        │                                         │
   [Receives SOS]                        [Receives SOS]
        │                                         │
        ├─► [Internet?] ──► YES ──► [Sync to Firebase]
        │                            │
        └─► [Internet?] ──► NO ──► [Store Locally]
                                    [Rebroadcast to Mesh]
```

## Components

### 1. Arduino ESP8266 Code (`ESP8266_SOS_Mesh.ino`)

#### Features:
- **SPIFFS Offline Storage**: Stores up to 50 pending SOS messages
- **ESP-NOW Mesh Networking**: Broadcasts SOS to nearby devices (20-200m range)
- **Internet Detection**: Checks connectivity every 30 seconds
- **Auto-Sync**: Syncs pending messages when internet is restored
- **Loop Prevention**: Prevents message loops in mesh network

#### Key Functions:

**`sendSOS()`**:
- Creates SOS message with device ID, location, timestamp
- Tries Firebase if online
- Always broadcasts via ESP-NOW
- Saves to queue if not synced

**`saveSOSToQueue()`**:
- Stores SOS in SPIFFS as JSON array
- Limits queue size to 50 messages
- Automatically removes oldest when full

**`syncPendingSOS()`**:
- Reads queue from SPIFFS
- Uploads all unsynced messages to Firebase
- Removes synced messages from queue
- Called when internet is restored

**`onESPDataRecv()`**:
- Receives SOS from mesh network
- Checks if already synced
- If online, syncs to Firebase immediately
- If offline, stores locally and rebroadcasts

**`checkInternet()`**:
- Verifies WiFi connection
- Tests Firebase connectivity
- Updates `hasInternet` flag
- Reinitializes Firebase/WebSocket when restored

#### Data Structure:

```cpp
struct SOSMessage {
  String deviceID;      // Unique device ID
  String message;       // "🚨 SOS Triggered!"
  float latitude;       // GPS latitude
  float longitude;      // GPS longitude
  unsigned long timestamp;  // Unix timestamp
  bool synced;          // Sync status
  String id;            // Unique message ID
};
```

### 2. React Native App (`sos.tsx`)

#### Features:
- **Firebase Realtime Database Listener**: Receives SOS from Arduino devices
- **Offline Storage**: Stores incoming alerts via AsyncStorage
- **WebRTC Mesh**: Peer-to-peer networking for app-to-app alerts
- **Auto-Sync**: Syncs offline alerts when online

#### Key Components:

**Firebase Realtime Database Listener**:
- Listens to `/devices/{deviceID}/SOS` path
- Receives real-time updates from ESP8266 devices
- Shows alerts in app even if originally sent offline
- Deduplicates messages to prevent duplicates

**Offline Storage**:
- Uses `sosStorage` (AsyncStorage) for persistence
- Stores incoming alerts even when app is offline
- Auto-syncs to Firestore when online

## Data Flow

### Scenario 1: Online Device

1. User presses SOS button on ESP8266
2. Device sends to Firebase Realtime Database: `/devices/{deviceID}/SOS`
3. App listener receives update immediately
4. App displays alert in incoming alerts section
5. Also broadcasts via ESP-NOW to nearby devices (redundancy)

### Scenario 2: Offline Device

1. User presses SOS button on ESP8266
2. Device detects no internet
3. Saves SOS to SPIFFS queue (`/sos_queue.json`)
4. Broadcasts via ESP-NOW to nearby devices
5. Nearby device receives SOS:
   - If online → Syncs to Firebase immediately
   - If offline → Stores locally and rebroadcasts
6. When any device comes online:
   - Reads local queue
   - Syncs all pending messages to Firebase
   - Removes synced messages from queue
7. App receives updates via Firebase listener

### Scenario 3: Partial Connectivity

- Device tries Firebase first
- If fails, falls back to offline mode
- Messages are saved to queue
- ESP-NOW broadcasts for redundancy
- Auto-syncs when connectivity restored

## Firebase Structure

### Realtime Database:
```
/devices/
  {deviceID}/
    SOS/
      message: "🚨 SOS Triggered!"
      latitude: 22.443834
      longitude: 88.416729
      timestamp: "1234567890"
```

### Firestore (App Alerts):
```
/sos_alerts/
  {alertID}/
    userId: "user123"
    location: { lat: 22.44, lng: 88.41 }
    time: timestamp
```

## ESP-NOW Mesh Network

### Range:
- **Indoors**: 20-50 meters
- **Outdoors**: 50-200 meters (line of sight)

### Protocol:
- Uses broadcast address (FF:FF:FF:FF:FF:FF)
- Each device rebroadcasts received SOS
- Loop prevention via message ID tracking
- Sync status prevents duplicate uploads

### Message Format:
```json
{
  "kind": "sos",
  "deviceID": "12345678",
  "message": "🚨 SOS Triggered!",
  "latitude": 22.443834,
  "longitude": 88.416729,
  "timestamp": 1234567890,
  "synced": false,
  "id": "1234567890_12345678"
}
```

## Configuration

### Arduino Settings:
```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASSWORD "YourPassword"
#define FIREBASE_HOST "https://your-project.firebaseio.com/"
#define FIREBASE_AUTH "YourAuthToken"
#define MAX_QUEUE_SIZE 50
```

### App Settings:
- Firebase config in `config/firebase.js`
- Realtime Database enabled automatically
- Listener auto-starts when user is authenticated

## Testing

### Test Offline Mode:
1. Upload code to ESP8266
2. Connect to WiFi
3. Test SOS button (should work)
4. Disconnect WiFi/internet
5. Press SOS button
6. Check Serial Monitor for "Offline Mode" message
7. Check SPIFFS for saved queue
8. Reconnect internet
9. Verify auto-sync of pending messages

### Test Mesh Network:
1. Set up 2+ ESP8266 devices
2. Place within 50m of each other
3. Disconnect internet from all devices
4. Press SOS on device 1
5. Device 2 should receive via ESP-NOW
6. Reconnect internet to device 2
7. Device 2 should sync to Firebase
8. App should receive alert

## Troubleshooting

### SPIFFS Issues:
- Code auto-formats SPIFFS on first run
- Ensure board has 4MB+ flash
- Check Serial Monitor for mount status

### ESP-NOW Not Working:
- Verify WiFi mode is `WIFI_STA`
- Check device proximity (within range)
- Ensure ESP-NOW initialization succeeds
- Check Serial Monitor for receive messages

### Messages Not Syncing:
- Verify Firebase credentials
- Check internet connectivity
- Review Serial Monitor for errors
- Verify queue file exists in SPIFFS

### App Not Receiving Alerts:
- Check Firebase Realtime Database listener
- Verify user is authenticated
- Check app console for errors
- Verify Firebase rules allow read access

## Security Considerations

1. **Firebase Rules**: Restrict write access to authenticated devices
2. **ESP-NOW**: Open protocol - consider encryption for sensitive data
3. **Message Validation**: Validate SOS messages before processing
4. **Rate Limiting**: Prevent spam SOS messages

## Future Enhancements

1. **Encryption**: Encrypt ESP-NOW messages
2. **GPS Integration**: Auto-update location from GPS module
3. **Battery Optimization**: Sleep mode when not in use
4. **Message Prioritization**: Priority queue for critical alerts
5. **Acknowledgment System**: Confirm SOS was received
6. **Range Extension**: Use repeater devices for longer range

