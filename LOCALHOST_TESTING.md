# Localhost Testing Guide

## How to Test WebRTC on Localhost

You can now easily test WebRTC with a local signaling server!

### Step 1: Start Local Signaling Server

Open a terminal and run:
```bash
npm run signaling-server
```

You should see:
```
🚀 Signaling server listening on:
   ws://localhost:8080 (local)
   ws://0.0.0.0:8080 (all interfaces)
```

### Step 2: Configure in App

1. **Open the SOS tab** in your app
2. **Toggle "Custom Signaling URL"** switch ON (only visible in development mode)
3. **Choose a preset** or **enter custom URL**:
   - **localhost** button → `ws://localhost:8080` (for web or iOS simulator)
   - **Emulator** button → `ws://10.0.2.2:8080` (for Android emulator)
   - **Auto** button → Uses auto-detected IP
   - **Manual** → Type your custom URL like `ws://192.168.1.100:8080`

### Step 3: Connect

1. Make sure you're **disconnected** (if already connected, disconnect first)
2. Tap **"Connect to Room"**
3. Check connection status - should show "Connected"

---

## Platform-Specific URLs

### Web Browser
- Use: `ws://localhost:8080`
- Click "localhost" preset button

### Android Emulator
- Use: `ws://10.0.2.2:8080`
- Click "Emulator" preset button

### iOS Simulator
- Use: `ws://localhost:8080`
- Click "localhost" preset button

### Physical Device (Expo Go or Development Build)
- Find your computer's IP:
  - Windows: `ipconfig` → Look for "IPv4 Address"
  - Mac/Linux: `ifconfig` or `ip addr`
- Use: `ws://YOUR_COMPUTER_IP:8080`
- Example: `ws://192.168.1.100:8080`

---

## Testing with Multiple Devices

1. Start signaling server on your computer
2. On each device:
   - Set custom URL to your computer's IP: `ws://YOUR_IP:8080`
   - Connect to the same Room ID (default: `sos_room`)
   - Peer count should increase as devices connect

---

## Switching Between Localhost and Production

### Development (Localhost)
- Toggle "Custom Signaling URL" ON
- Enter localhost URL
- Use for testing

### Production (Render Server)
- Toggle "Custom Signaling URL" OFF
- App automatically uses: `wss://webrtc-m646.onrender.com`
- Use for deployed builds

---

## Troubleshooting

**Can't connect to localhost?**
- Make sure signaling server is running
- Check firewall settings (port 8080 must be open)
- Verify the URL format (must start with `ws://`)

**Physical device can't connect?**
- Ensure device and computer are on same WiFi
- Use your computer's IP (not `localhost`)
- Check firewall allows connections on port 8080

**Connection works but no peers?**
- Make sure all devices use same Room ID
- Check that signaling server is accessible
- Verify all devices are connected to the same signaling server

