# WebRTC Build & Deployment Guide (Simple)

## ❌ Can I build APK from Expo Go?

**NO.** Expo Go **does not support WebRTC** because:
- Expo Go is a limited sandbox app
- WebRTC requires native code modules
- Native modules are not supported in Expo Go

## ✅ What DO I Need?

You need a **Development Build** (also called Custom Build or Bare Workflow), NOT Expo Go.

## 📱 How to Build APK with WebRTC

### Step 1: Install WebRTC Package
```bash
npm install react-native-webrtc
```

### Step 2: Create Development Build
You have 2 options:

#### Option A: EAS Build (Recommended - Easiest)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure (choose Android)
eas build:configure

# Build APK
eas build --platform android --profile preview
```
This creates an APK you can download and install.

#### Option B: Local Build (More Complex)
```bash
# Generate native code
npx expo prebuild

# Build APK locally (requires Android Studio)
npx expo run:android
```

## 🌐 Where to Host Signaling Server?

The signaling server MUST be accessible from your phone's internet connection.

### Option 1: Free/Cheap Cloud Hosting (Recommended)

#### Heroku (Free tier discontinued, but cheap)
```bash
# Deploy to Heroku
heroku create your-signaling-server
git push heroku main
```
**Cost**: ~$5-7/month

#### Railway (Easy & Free Tier Available)
1. Go to https://railway.app
2. Deploy from GitHub
3. Set PORT env variable
**Cost**: Free tier available, then ~$5/month

#### Render (Free Tier Available)
1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
**Cost**: Free tier available

#### DigitalOcean App Platform
**Cost**: ~$5/month

### Option 2: Your Own Server/VPS
- AWS EC2
- Google Cloud Platform
- Azure
- Linode
- Vultr
**Cost**: ~$5-10/month

### Option 3: Local Network (Testing Only)
- Your computer's IP: `ws://192.168.1.100:8080`
- Only works on same WiFi network
- NOT for production

## 🔧 Signaling Server Configuration

### For Production Build:
1. Update `app/(tabs)/sos.tsx`:
```typescript
const getDefaultSignalingUrl = (): string => {
  if (!__DEV__) {
    // Production: your hosted server
    return 'wss://your-signaling-server.railway.app'; // or your domain
  }
  // ... rest of code
}
```

### Important Notes:
- Use `wss://` (secure WebSocket) for production, not `ws://`
- The URL must be publicly accessible
- Port 8080 must be open (or use port 443 with SSL)

## 📋 Quick Checklist

- [ ] Install `react-native-webrtc`
- [ ] Create development build (EAS or local)
- [ ] Deploy signaling server to cloud
- [ ] Update production URL in code
- [ ] Build APK
- [ ] Test on physical device

## 💡 Simple Answer Summary

**Q: Will WebRTC work if I build APK from Expo Go?**
A: **NO** - You need a development build, not Expo Go.

**Q: What about the signaling server?**
A: Host it on Railway/Render/Heroku (free/cheap options available).

**Q: Where exactly?**
A: In your production code, replace `ws://localhost:8080` with your cloud server URL like `wss://my-server.railway.app`.

