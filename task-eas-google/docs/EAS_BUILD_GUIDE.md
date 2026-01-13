# EAS Development Build Guide

## 🚀 Building Your Production-Ready App

Follow these steps to create a development build with all native modules.

## Step 1: Verify EAS CLI

```bash
# Check if EAS CLI is installed
eas --version

# If not installed, install it
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

## Step 3: Configure Build (Already Done!)

Your `eas.json` is already configured:
- ✅ Development profile set up
- ✅ Distribution set to internal
- ✅ Project ID configured

## Step 4: Create Development Build

### For Android:
```bash
eas build --profile development --platform android
```

### For iOS (if you have a Mac):
```bash
eas build --profile development --platform ios
```

### For Both:
```bash
eas build --profile development --platform all
```

## What Happens During Build:

1. **Upload**: Code is uploaded to EAS servers
2. **Install**: Dependencies are installed
3. **Compile**: Native modules are compiled
4. **Build**: APK/IPA is created
5. **Download**: Build artifact is available

**Time**: Usually 10-20 minutes

## Step 5: Install the Build

### Option A: Direct Download
1. Build completes
2. Click the download link in terminal
3. Install APK on Android device
4. Or install IPA via TestFlight (iOS)

### Option B: QR Code
1. Scan QR code shown after build
2. Download and install

## Step 6: Run Development Server

After installing the build:

```bash
npx expo start --dev-client
```

Then:
1. Open the app you just installed (NOT Expo Go)
2. Scan the QR code
3. App will connect and load your code

## 🎯 What You Get

With this development build:
- ✅ All native modules work (AsyncStorage, SecureStore)
- ✅ Google Sign-In works
- ✅ Fast refresh during development
- ✅ Can test on real device
- ✅ Production-like environment

## 📝 Build Command Summary

```bash
# Android development build
eas build --profile development --platform android

# After build completes and is installed:
npx expo start --dev-client
```

## ⚠️ Important Notes

1. **First build takes longer** (10-20 min)
2. **Subsequent builds are faster** (cached dependencies)
3. **You only need to rebuild when**:
   - Adding new native modules
   - Changing native configuration
   - Updating Expo SDK
4. **Code changes don't require rebuild** (use fast refresh)

## 🐛 Troubleshooting

### Build Fails
- Check your internet connection
- Verify EAS account has build credits
- Check build logs for specific errors

### Can't Install APK
- Enable "Install from Unknown Sources" on Android
- Check device storage space

### App Won't Connect
- Make sure you're using the dev build (not Expo Go)
- Check that dev server is running
- Ensure device and computer are on same network

## ✅ Success Checklist

- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Build command executed
- [ ] Build completed successfully
- [ ] APK/IPA downloaded
- [ ] App installed on device
- [ ] Dev server running (`npx expo start --dev-client`)
- [ ] App connects to dev server
- [ ] Can see your app screens

## 🎉 Next Steps

Once your build is installed:
1. Start dev server: `npx expo start --dev-client`
2. Open the installed app
3. Test all features
4. Make code changes (they'll hot reload!)
5. Test authentication
6. Test CRUD operations

---

**Ready to build?** Run:
```bash
eas build --profile development --platform android
```
