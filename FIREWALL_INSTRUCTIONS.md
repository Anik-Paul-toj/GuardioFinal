# Firewall Instructions for Signaling Server

## Windows Firewall

If the signaling server isn't connecting from your physical device, you may need to allow port 8080 through Windows Firewall.

### Option 1: Allow Port Through Firewall (Recommended)

1. Open **Windows Defender Firewall**:
   - Press `Win + R`, type `wf.msc`, press Enter
   - Or search "Windows Defender Firewall" in Start menu

2. Click **Inbound Rules** → **New Rule**

3. Select **Port** → **Next**

4. Select **TCP** and enter port **8080** → **Next**

5. Select **Allow the connection** → **Next**

6. Check all profiles (Domain, Private, Public) → **Next**

7. Name it "WebRTC Signaling Server" → **Finish**

### Option 2: Quick PowerShell Command (Run as Administrator)

```powershell
New-NetFirewallRule -DisplayName "WebRTC Signaling Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### Option 3: Temporarily Disable Firewall (NOT RECOMMENDED - Only for Testing)

Only use this for quick testing:
1. Open Windows Defender Firewall
2. Click "Turn Windows Defender Firewall on or off"
3. Turn off for Private networks (temporarily)
4. **Remember to turn it back on!**

## Verify Your IP Address

Run this in CMD to see your IP addresses:
```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).

The app should automatically detect the correct IP, but if you need to manually set it, update `app/(tabs)/sos.tsx` with your IP address.

