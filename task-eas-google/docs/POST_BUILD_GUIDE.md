# Post-Build Setup & Testing Guide

## 🎉 Your Build is in Progress!

While waiting for the build to complete (usually 10-20 minutes), here's what to expect and how to proceed.

## 📊 Build Progress

You can monitor your build:
1. **In Terminal**: Watch the progress output
2. **On Web**: Visit https://expo.dev/accounts/hajzerbela/projects/task-eas-google/builds
3. **Build Status**: You'll see stages like:
   - ⏳ Queued
   - 🔄 In Progress
   - ✅ Finished
   - ❌ Failed (if errors occur)

## ✅ When Build Completes

### Step 1: Download the APK

You'll see a download link in the terminal or on the Expo website:

```
✔ Build finished
https://expo.dev/artifacts/eas/[build-id].apk
```

### Step 2: Install on Your Android Device

**Option A: Direct Download**
1. Open the link on your Android device
2. Download the APK
3. Tap to install
4. Allow "Install from Unknown Sources" if prompted

**Option B: QR Code**
1. Scan the QR code shown in terminal
2. Download and install

**Option C: Transfer via USB**
1. Download APK to computer
2. Connect device via USB
3. Copy APK to device
4. Install from file manager

### Step 3: Start Development Server

After installing the app:

```bash
npx expo start --dev-client
```

### Step 4: Connect the App

1. Open the app you just installed (NOT Expo Go)
2. You'll see a screen to connect to dev server
3. Options:
   - **Scan QR code** from terminal
   - **Enter URL manually**
   - **Shake device** for dev menu

## 🧪 Testing Checklist

Once connected, test these features:

### Authentication
- [ ] App shows login screen on first launch
- [ ] Tap "Continue with Google"
- [ ] Google Sign-In sheet appears
- [ ] Select Google account
- [ ] Successfully redirects to app
- [ ] User name appears in header
- [ ] Can logout and login again

### Task Management
- [ ] **Create Task**
  - Go to Create tab
  - Enter title and description
  - Task appears in list
- [ ] **View Tasks**
  - See all tasks in list
  - Search works
  - Filter works (All/Pending/Completed)
- [ ] **View Task Detail**
  - Tap on a task
  - See full details
  - All buttons visible
- [ ] **Edit Task**
  - Tap Edit button
  - Modify title/description
  - Changes save correctly
- [ ] **Toggle Completion**
  - Tap checkbox on task
  - Visual changes (strikethrough, etc.)
  - Status updates
- [ ] **Delete Task**
  - Tap Delete button
  - Confirmation dialog appears
  - Task removed from list

### Navigation
- [ ] Tab navigation works smoothly
- [ ] Back button works correctly
- [ ] Deep navigation (Tasks → Detail → Edit → Back)
- [ ] Profile screen displays correctly

### Performance
- [ ] App loads quickly
- [ ] Smooth scrolling
- [ ] No crashes
- [ ] Fast refresh works (make code change)

## 🐛 Troubleshooting

### Build Failed
**Check the error logs:**
```bash
eas build:view [build-id]
```

**Common issues:**
- Missing dependencies → Check package.json
- Invalid config → Check app.json
- Build timeout → Retry the build

### Can't Install APK
**Enable Unknown Sources:**
1. Settings → Security
2. Enable "Install from Unknown Sources"
3. Or enable for specific app (Chrome, Files)

### App Won't Connect to Dev Server
**Check:**
- [ ] Using the dev build (not Expo Go)
- [ ] Dev server is running (`npx expo start --dev-client`)
- [ ] Device and computer on same WiFi
- [ ] Firewall not blocking connection
- [ ] Try entering URL manually

**Get the URL:**
```bash
# The dev server shows URLs like:
exp://192.168.1.XXX:8081
```

### AsyncStorage Still Not Working
**This shouldn't happen with dev build, but if it does:**
1. Uninstall the app completely
2. Rebuild: `eas build --profile development --platform android`
3. Reinstall fresh APK

### Google Sign-In Fails
**Check:**
- [ ] `EXPO_PUBLIC_WEB_CLIENT_ID` in .env
- [ ] OAuth configured in Google Cloud Console
- [ ] SHA-1 fingerprint added (for Android)
- [ ] Backend server is running

## 📱 Development Workflow

Once everything works:

### Making Code Changes
1. Edit your code
2. Save the file
3. App auto-refreshes (Fast Refresh)
4. No rebuild needed!

### When to Rebuild
You only need to rebuild when:
- Adding new native modules
- Changing app.json configuration
- Updating Expo SDK version
- Changing native code

### Daily Development
```bash
# Start backend
cd server
npm run dev

# In another terminal, start Expo
cd ..
npx expo start --dev-client

# Open the installed app on your device
# Make code changes and see them instantly!
```

## 🎯 Next Steps After Successful Testing

1. **Test All Features** - Go through the testing checklist
2. **Fix Any Bugs** - Address issues found during testing
3. **Update Backend** - Optionally add pagination (see BACKEND_UPDATES.md)
4. **Production Build** - When ready:
   ```bash
   eas build --profile production --platform android
   ```
5. **Submit to Store** - Deploy to Google Play Store:
   ```bash
   eas submit --platform android
   ```

## 📊 Build Information

**Your Build Details:**
- **Platform**: Android
- **Profile**: Development
- **Account**: hajzerbela
- **Project**: task-eas-google
- **Plan**: Starter

**Build Includes:**
- ✅ All native modules (AsyncStorage, SecureStore)
- ✅ Google Sign-In
- ✅ Development tools
- ✅ Fast Refresh
- ✅ Remote debugging

## 💡 Tips

1. **Keep Dev Server Running**: Leave it running while developing
2. **Shake for Dev Menu**: Shake device to access developer options
3. **Check Logs**: Terminal shows all console.log output
4. **Network Inspector**: Use React Native Debugger for network requests
5. **Hot Reload**: Most changes don't require app restart

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Review the troubleshooting section
3. Check Expo build logs
4. Verify all environment variables
5. Ensure backend is running

## ✅ Success Indicators

You'll know everything works when:
- ✅ Build completes successfully
- ✅ APK installs on device
- ✅ App connects to dev server
- ✅ Can login with Google
- ✅ Can create/view/edit/delete tasks
- ✅ Navigation works smoothly
- ✅ Code changes hot reload

---

**Current Status**: ⏳ Build in queue...

**Next**: Wait for build to complete, then follow Step 1 above!

**Estimated Time**: 10-20 minutes for build + 5 minutes for installation and testing

🎉 **You're almost there!**
