# Debugging expo-contacts Module Not Found

## Step 1: Verify expo-contacts is in the EAS Build

Check your EAS build logs for these lines:

### ✅ What you SHOULD see:
```
✔ Applying config plugin: expo-contacts
```

### ❌ If you see this instead:
```
⚠ Skipping plugin: expo-contacts
```
or nothing about expo-contacts, then it wasn't included in the build!

## Step 2: Check Your Current Setup

Run this command:
```bash
npx expo config --type introspect
```

Look for expo-contacts in the output. It should show the plugin configuration.

## Step 3: Verify Package Installation

```bash
npm list expo-contacts
```

Expected output:
```
expo-contacts@~15.0.11
```

## Step 4: Check app.json

Verify expo-contacts is in the plugins array:
```json
{
  "expo": {
    "plugins": [
      "expo-contacts"  // ← Must be here
    ]
  }
}
```

## Most Likely Causes

### Cause 1: Build Cache Issue
The EAS build might have cached an old version without expo-contacts.

**Solution:**
```bash
eas build --platform android --profile development --clear-cache
```

### Cause 2: Metro Can't Resolve the Module
Even if expo-contacts is in the APK, Metro might fail to bundle the JavaScript bridge.

**Solution - Try Lazy Loading:**

Instead of:
```javascript
import * as Contacts from 'expo-contacts';
```

Try:
```javascript
// At top of file
let Contacts: any = null;

// In function
async function loadContacts() {
  if (!Contacts) {
    Contacts = require('expo-contacts');
  }
  return Contacts;
}
```

### Cause 3: Different Import Pattern

expo-notifications might use a different import pattern that Metro handles better.

Check how you're importing:
- expo-notifications: How is it imported in your code?
- expo-contacts: How is it imported?

## Quick Test

Try this in one of your components:

```javascript
// Test if the module exists
import { Platform } from 'react-native';

// Use dynamic require
const loadExpoContacts = async () => {
  try {
    const Contacts = require('expo-contacts');
    console.log('✅ expo-contacts loaded successfully');
    return Contacts;
  } catch (error) {
    console.error('❌ Failed to load expo-contacts:', error);
    return null;
  }
};
```

## Next Steps

1. Check EAS build logs for expo-contacts plugin application
2. If NOT in logs → Rebuild with --clear-cache
3. If IN logs → The issue is with Metro bundling, not the build
4. Try lazy loading approach in ContactDisplay and ContactSearchButton

---

**Report back:**
- Did you see "Applying config plugin: expo-contacts" in EAS build logs?
- What does `npm list expo-contacts` show?
