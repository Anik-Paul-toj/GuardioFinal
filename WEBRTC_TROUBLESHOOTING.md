# WebRTC Troubleshooting Guide

## Common Issues and Solutions

### WebSocket Connection Errors

#### Error: "WebSocket error" with readyState 3 (CLOSED)

**Cause:** The app cannot connect to the signaling server.

**Solutions:**

1. **Make sure the signaling server is running:**
   ```bash
   npm run signaling-server
   ```
   You should see: `Signaling server listening on ws://localhost:8080`

2. **Check your platform:**
   - **Web**: Should use `ws://localhost:8080`
   - **Android Emulator**: Automatically uses `ws://10.0.2.2:8080`
   - **iOS Simulator**: Uses `ws://localhost:8080`
   - **Physical Devices**: Need your computer's IP address

3. **For physical devices, update the IP address:**
   - Find your computer's IP: 
     - Windows: `ipconfig`
     - Mac/Linux: `ifconfig` or `ip addr`
   - Update `app/(tabs)/sos.tsx` with your IP address
   - Make sure device and computer are on the same WiFi network

4. **Firewall issues:**
   - Allow port 8080 through your firewall
   - Windows: Windows Firewall settings
   - Mac: System Preferences > Security & Privacy > Firewall

### Android Emulator Specific

The Android emulator uses a special network setup:
- Emulator → Host: Use `10.0.2.2` instead of `localhost` or your IP
- This is already configured automatically in the code

If you're using a physical Android device:
- Use your computer's actual IP address (e.g., `192.168.1.100`)
- Both must be on the same WiFi network

### iOS Simulator vs Physical Device

- **Simulator**: Can use `localhost` directly
- **Physical Device**: Must use your computer's IP address

### Connection Retry Behavior

The app automatically retries connections with exponential backoff:
- First retry: 1 second
- Second retry: 2 seconds
- Third retry: 4 seconds
- ...up to 30 seconds max
- Maximum 10 attempts before giving up

If connection fails after 10 attempts, check:
1. Is the signaling server running?
2. Is the URL correct for your platform?
3. Are firewall rules blocking the connection?
4. Are you on the correct network?

### Testing the Signaling Server

You can test if the server is accessible:

1. **From web browser console:**
   ```javascript
   const ws = new WebSocket('ws://localhost:8080');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```

2. **From command line (if you have wscat installed):**
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:8080
   ```

3. **Check server logs** - The server logs all connections and errors

### WebRTC Peer Connection Issues

If WebSocket connects but peer connections fail:

1. **Check STUN server:** The app uses Google's public STUN server
   - `stun:stun.l.google.com:19302`
   - This should work without configuration

2. **Network restrictions:** 
   - Some networks block WebRTC traffic
   - Corporate networks may have restrictions
   - Try on a different network

3. **Platform support:**
   - Web: Uses browser's native WebRTC APIs
   - Native: May require `react-native-webrtc` package
   - Currently configured to use web APIs (works on Expo web)

### Debug Logging

The app includes detailed logging:
- Connection attempts and successes
- WebSocket events (open, close, error)
- Peer connection states
- Message handling

Check your console/terminal for these logs to diagnose issues.

