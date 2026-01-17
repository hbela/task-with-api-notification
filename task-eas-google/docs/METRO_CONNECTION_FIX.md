# Metro Connection Troubleshooting

## Issue
- Scanning QR code does nothing
- No Metro logs appearing
- Both dev-client and Expo Go not connecting

## Root Cause
Your device can't reach Metro server on your computer. This is a **network issue**, not a code issue.

## ✅ Solutions (Try in Order)

### Solution 1: Use Tunnel Mode (Easiest)

```bash
# Stop current Metro (Ctrl+C)

# Start with tunnel
npx expo start --tunnel

# Wait for "Tunnel ready" message
# Then scan QR code
```

**Why this works:** Tunnel bypasses local network issues by routing through Expo servers.

### Solution 2: Manual Connection (If Tunnel Fails)

```bash
# Stop Metro
# Start normally
npx expo start

# Note the Metro URL (e.g., exp://192.168.1.100:8081)
```

**Then on your device:**

**For Expo Go:**
1. Open Expo Go
2. Tap "Enter URL manually"
3. Type the exp:// URL from Metro
4. Press Connect

**For Dev Client:**
1. Reinstall the APK first
2. Open the app
3. Shake device → Dev Menu
4. Tap "Enter URL manually"
5. Type the exp:// URL
6. Press Connect

### Solution 3: Check Network Connection

**Ensure both devices are on the same WiFi:**

```bash
# On your computer (PowerShell):
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

**On your Android device:**
- Settings → WiFi → Tap connected network
- Check IP address (should be same subnet, e.g., 192.168.1.xxx)

**If different subnets:** Connect both to the same WiFi network.

### Solution 4: Firewall Check

Windows Firewall might be blocking Metro:

```powershell
# Run as Administrator
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

Or manually:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find "Node.js" and check both Private and Public
4. If not listed, click "Allow another app" → Browse to node.exe

### Solution 5: Use USB Connection (Most Reliable)

```bash
# Connect device via USB
# Enable USB debugging on Android

# Run:
adb reverse tcp:8081 tcp:8081

# Then start Metro:
npx expo start --dev-client

# Open app on device (don't scan QR)
```

## 🔍 Diagnostic Steps

### Check Metro is Running

When you run `npx expo start`, you should see:

```
Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

**If you don't see this:** Metro didn't start properly.

### Check Metro Logs

When device connects, you should see:

```
› Opening on Android...
› Opening exp://192.168.1.100:8081 on DEVICE_NAME
```

**If you see nothing:** Device isn't reaching Metro.

## 🚀 Recommended Approach

**For now, use tunnel mode:**

```bash
# 1. Stop Metro (Ctrl+C)

# 2. Start with tunnel
npx expo start --tunnel --clear

# 3. Wait for "Tunnel ready" message (may take 30-60 seconds)

# 4. Scan QR code with Expo Go

# 5. Should see Metro logs when app loads
```

**Tunnel is slower but works through any network.**

## ⚠️ Important Notes

### About Dev Client
Since you deleted the app, you need to **reinstall the EAS build APK** to use dev-client mode:

```bash
# You can't use --dev-client without the dev client app installed
# Either:
# 1. Reinstall the APK you built with EAS
# 2. Or use Expo Go for testing (no native modules)
```

### About Expo Go
Expo Go will work for testing navigation, but:
- ❌ expo-contacts won't work (needs custom build)
- ❌ expo-notifications might not work fully
- ✅ Navigation will work
- ✅ UI/UX will work

## 📋 Quick Checklist

- [ ] Both devices on same WiFi?
- [ ] Metro shows IP address (not localhost)?
- [ ] Firewall allows Node.js?
- [ ] Tried tunnel mode?
- [ ] For dev-client: APK installed?
- [ ] For Expo Go: Latest version installed?

## 🎯 Next Steps

**Try this now:**

```bash
# Terminal
npx expo start --tunnel --clear

# Wait for "Tunnel ready"
# Scan QR with Expo Go
# Should see Metro logs when connecting
```

If tunnel works, you can test navigation. Later, rebuild with EAS for native modules.

---

**Status:** Waiting for tunnel connection test
