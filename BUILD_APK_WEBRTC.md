# Build APK with WebRTC - Step by Step

## ✅ Step 1: Install WebRTC Package

```bash
npm install react-native-webrtc
```

This adds WebRTC support to your app.

---

## ✅ Step 2: Update Production URL (Already Done!)

The app is already configured to use your Render server:
- **Production URL**: `wss://webrtc-m646.onrender.com`

---

## ✅ Step 3: Build APK with EAS Build (EASIEST METHOD)

### Install EAS CLI:
```bash
npm install -g eas-cli
```

### Login to Expo:
```bash
eas login
```
(Create account if you don't have one - it's free)

### Configure for Android:
```bash
eas build:configure
```
Select **Android** when asked.

### Build APK:
```bash
eas build --platform android --profile preview
```

This will:
- Build your app in the cloud
- Take 10-15 minutes
- Give you a download link for the APK

### Install APK:
1. Download the APK from the link
2. Transfer to your phone
3. Install (enable "Install from unknown sources" in Android settings)
4. Test WebRTC!

---

## Alternative: Local Build (More Complex)

If you prefer to build locally:

```bash
# Generate native code
npx expo prebuild

# Build APK (requires Android Studio)
npx expo run:android --variant release
```

---

## ⚠️ Important Notes:

1. **WebRTC REQUIRES Development Build** - Can't use Expo Go
2. **First build takes 15-20 minutes** - Subsequent builds are faster
3. **Free EAS Build** - Expo gives you free builds every month
4. **APK Size** - Will be larger because it includes WebRTC native modules (~50-80 MB)

---

## 🧪 Testing Checklist:

After installing APK:
- [ ] Open the app
- [ ] Go to SOS tab
- [ ] Check if WebRTC warning is gone (should show "Connect to Room" button)
- [ ] Tap "Connect to Room"
- [ ] Check logs - should connect to `wss://webrtc-m646.onrender.com`
- [ ] Test with 2 devices on same network

---

## 🔍 Troubleshooting:

**If WebRTC still shows "Unavailable":**
- Make sure `react-native-webrtc` is installed
- Rebuild the APK
- Development builds only (not Expo Go)

**If connection fails:**
- Check Render server is running
- Use `wss://` not `ws://` for production
- Check phone's internet connection

