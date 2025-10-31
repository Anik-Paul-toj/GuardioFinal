# WebRTC Signaling Server

This document explains how to set up and use the WebRTC mesh networking for the SOS feature.

## Signaling Server

The signaling server is required for WebRTC peer-to-peer connections. It facilitates the initial connection between devices.

### Running the Signaling Server

#### Option 1: Using npm script (Recommended)
```bash
npm run signaling-server
```

This will start the server on `ws://localhost:8080` by default.

#### Option 2: Run directly
```bash
node scripts/signaling-server.js
```

#### Option 3: Custom port
```bash
PORT=3000 node scripts/signaling-server.js
```

### Keep Server Running

The signaling server must be running for WebRTC mesh networking to work. 

**For development:**
- Run the signaling server in a separate terminal
- Or use `npm run dev` (if configured) to run both Expo and the signaling server

**For production:**
- Deploy the signaling server to a cloud service (e.g., Heroku, Railway, DigitalOcean)
- Update the `signalingUrl` in `lib/webrtc.ts` or your SOS page configuration

### Configuration

The server listens on port 8080 by default. You can change this by setting the `PORT` environment variable.

#### Platform-Specific Connection URLs

The app automatically uses different URLs based on your platform:

- **Web**: `ws://localhost:8080`
- **Android Emulator**: `ws://10.0.2.2:8080` (automatically configured)
- **iOS Simulator**: `ws://localhost:8080` (automatically configured)
- **Physical Devices**: Requires your computer's IP address

#### For Physical Devices

If you're testing on a physical device, you need to:

1. **Find your computer's local IP address:**
   - Windows: Run `ipconfig` and look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig` or `ip addr` and look for your network interface

2. **Update the signaling URL in `app/(tabs)/sos.tsx`:**
   
   Find the `getDefaultSignalingUrl` function and update it:
   ```typescript
   } else if (Platform.OS === 'android') {
     // Replace with your computer's IP
     return 'ws://192.168.1.100:8080'; // YOUR_IP:8080
   } else if (Platform.OS === 'ios') {
     // Replace with your computer's IP
     return 'ws://192.168.1.100:8080'; // YOUR_IP:8080
   }
   ```

3. **Make sure your device and computer are on the same WiFi network**

4. **Allow the port through your firewall** (Windows Firewall, Mac Firewall, etc.)

#### Troubleshooting Connection Issues

If you see WebSocket errors:

1. **Verify the signaling server is running:**
   ```bash
   npm run signaling-server
   ```
   You should see: `Signaling server listening on ws://localhost:8080`

2. **Check the console logs** - The app logs connection attempts and errors

3. **For Android Emulator:** The code automatically uses `10.0.2.2` which is the emulator's special IP to reach the host machine

4. **For iOS Simulator:** Uses `localhost` which should work automatically

5. **For Physical Devices:** 
   - Make sure both devices are on the same network
   - Verify the IP address is correct
   - Check your firewall settings
   - Try pinging your computer from the device (if possible)

6. **Connection retry logic:** The app automatically retries connections with exponential backoff (up to 10 attempts)

### Dependencies

The signaling server requires:
- Node.js
- `ws` package (installed via `npm install`)

