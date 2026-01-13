# Google Sign-In Configuration Fix

## 🔴 Error: "No ID token received from Google"

This error occurs when Google Sign-In isn't properly configured for your Android app.

## ✅ **Solution**

### Step 1: Check Your .env File

Make sure you have the Web Client ID:

```env
EXPO_PUBLIC_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### Step 2: Get Your Android SHA-1 Fingerprint

For **development builds**, you need to add the SHA-1 fingerprint to Google Cloud Console.

#### Get SHA-1 from EAS:

```bash
eas credentials
```

Then:
1. Select **Android**
2. Select **Keystore**
3. Copy the **SHA-1 fingerprint**

#### Or get it from your local keystore:

```bash
keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
```

### Step 3: Add SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (Android type)
5. If you don't have an Android client ID, create one:
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Android**
   - Package name: `com.taskmanager.app` (from app.json)
   - SHA-1 certificate fingerprint: Paste the SHA-1 from Step 2
6. Click **Save**

### Step 4: Verify Configuration

The updated code now logs the sign-in result. Try signing in again and check the logs:

```
Sign-in result: { ... }
ID Token: Present/Missing
```

If you see "Missing", the issue is with Google Cloud Console configuration.

## 🔍 **Debug Steps**

### 1. Check Console Logs

After trying to sign in, check the Metro bundler logs for:
- The full sign-in result structure
- Whether ID token is present

### 2. Verify Package Name

In `app.json`, make sure the package name matches what you configured in Google Cloud Console:

```json
{
  "android": {
    "package": "com.taskmanager.app"
  }
}
```

### 3. Verify Web Client ID

The `EXPO_PUBLIC_WEB_CLIENT_ID` should be the **Web client ID**, not the Android client ID.

## 📝 **Complete Checklist**

- [ ] Web Client ID in .env file
- [ ] Android OAuth client created in Google Cloud Console
- [ ] Package name matches (com.taskmanager.app)
- [ ] SHA-1 fingerprint added to Android OAuth client
- [ ] App rebuilt after configuration changes

## 🔄 **After Fixing Configuration**

1. **Don't need to rebuild** - just restart the app
2. Try signing in again
3. Check the console logs
4. ID token should now be present

## 💡 **Common Issues**

### Issue: Still no ID token

**Possible causes:**
1. Wrong package name
2. SHA-1 fingerprint not added
3. Using wrong client ID type
4. OAuth consent screen not configured

### Issue: "hasPlayServices" error

**Solution**: Make sure you're testing on a real device with Google Play Services, not an emulator without Play Services.

## 🎯 **Quick Fix**

If you just want to test quickly, you can temporarily modify the code to skip the ID token check (NOT for production):

```typescript
// TEMPORARY - FOR TESTING ONLY
if (!idToken) {
  console.warn('No ID token - using email as fallback');
  // This won't work with your backend, but helps debug
}
```

But the proper fix is to configure Google Cloud Console correctly.

---

**Next**: Check the Metro logs after trying to sign in again to see what's in the sign-in result.
