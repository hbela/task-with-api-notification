# 🔍 Localization Troubleshooting Guide

## 🐛 Current Issue

Only "No pending tasks" is translating, while the rest of the screen remains in the previous language.

## 🔧 Diagnostic Steps

### Step 1: Check Console Logs

After changing language, check the console for these logs:

```
[LanguageSwitcher] Changing language from X to Y
[LanguageSwitcher] Language changed in i18n, new locale: Y
[LanguageSwitcher] Triggered app refresh
[LanguageSwitcher] Navigating back to task list
[TasksScreen] Rendering with key: 1 (or 2, 3, etc.)
[TasksScreen] Current translations: { title: "...", ... }
```

### Step 2: Verify Key is Changing

**Expected:** Key should increment each time you change language (0 → 1 → 2 → 3...)

**If key is NOT changing:**
- LanguageContext is not updating
- Check that LanguageProvider is wrapping the app in `app/_layout.tsx`

**If key IS changing but UI not updating:**
- Component is not using the key properly
- Need to add `key={_key}` to root element

### Step 3: Check Translation Values

Look at the console log output:
```
[TasksScreen] Current translations: {
  title: "My Tasks",  // Should be in new language
  searchPlaceholder: "Search tasks...",  // Should be in new language
  filterPending: "Pending"  // Should be in new language
}
```

**If translations are correct in console but not on screen:**
- React is not re-rendering the component
- The `key={_key}` prop might not be on the root element

**If translations are wrong in console:**
- i18n locale is not actually changing
- Translation files might be cached

## 🔄 Solutions to Try

### Solution 1: Force App Reload

**Metro bundler might be caching old code.**

1. In terminal where Metro is running, press `r` to reload
2. Or shake device → "Reload"
3. Or completely stop and restart: `npx expo start --clear`

### Solution 2: Clear All Caches

```bash
# Stop Metro
# Then run:
npx expo start --clear

# Or more aggressive:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### Solution 3: Verify Root Element Has Key

Check `app/(app)/index.tsx` line ~165:

```typescript
return (
  <View style={styles.container} key={_key}>  // ✅ Must have key={_key}
    {/* rest of component */}
  </View>
);
```

### Solution 4: Check AsyncStorage

The language might not be saving properly:

```javascript
// In your app, add this temporarily to check:
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getItem('app_language').then(lang => {
  console.log('Saved language:', lang);
});
```

### Solution 5: Verify i18n Locale

Add this to `LanguageSwitcher.tsx` after changing language:

```typescript
console.log('i18n.locale before:', i18n.locale);
await changeAppLanguage(languageCode);
console.log('i18n.locale after:', i18n.locale);
console.log('Test translation:', i18n.t('tasks.title'));
```

## 🎯 Expected Flow

When you change language, this should happen:

1. **Tap language** in Settings
2. **LanguageSwitcher logs:**
   ```
   [LanguageSwitcher] Changing language from en to fr
   [LanguageSwitcher] Language changed in i18n, new locale: fr
   [LanguageSwitcher] Triggered app refresh
   ```
3. **Context key increments:** 0 → 1
4. **All components using useTranslation re-render**
5. **TasksScreen logs:**
   ```
   [TasksScreen] Rendering with key: 1
   [TasksScreen] Current translations: { title: "Mes tâches", ... }
   ```
6. **Navigate back to task list**
7. **Everything is in French**

## 🔍 What to Check in Console

### Good Output:
```
[LanguageSwitcher] Current locale: en Context key: 0
[LanguageSwitcher] Changing language from en to fr
[LanguageSwitcher] Language changed in i18n, new locale: fr
[LanguageSwitcher] Triggered app refresh
[LanguageSwitcher] Navigating back to task list
[TasksScreen] Rendering with key: 1  ← Key changed!
[TasksScreen] Current translations: {
  title: "Mes tâches",  ← In French!
  searchPlaceholder: "Rechercher des tâches...",
  filterPending: "En attente"
}
```

### Bad Output (Problem):
```
[LanguageSwitcher] Changing language from en to fr
[LanguageSwitcher] Language changed in i18n, new locale: fr
[LanguageSwitcher] Triggered app refresh
[TasksScreen] Rendering with key: 0  ← Key didn't change!
[TasksScreen] Current translations: {
  title: "My Tasks",  ← Still in English!
  searchPlaceholder: "Search tasks...",
  filterPending: "Pending"
}
```

## 🛠️ Quick Fixes

### Fix 1: Restart Metro with Cache Clear
```bash
# Kill Metro (Ctrl+C)
npx expo start --clear
```

### Fix 2: Verify Key Prop
```typescript
// In app/(app)/index.tsx
return (
  <View style={styles.container} key={_key}>  // Must be here!
```

### Fix 3: Check LanguageProvider
```typescript
// In app/_layout.tsx
export default function RootLayout() {
  return (
    <LanguageProvider>  {/* Must wrap everything */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
```

## 📊 Debugging Checklist

- [ ] Console shows language changing
- [ ] Console shows key incrementing
- [ ] Console shows translations in new language
- [ ] Root View has `key={_key}` prop
- [ ] LanguageProvider wraps app
- [ ] Metro cache cleared
- [ ] App fully reloaded
- [ ] AsyncStorage has correct language
- [ ] No TypeScript errors
- [ ] No runtime errors in console

## 🎯 If Still Not Working

1. **Share console output** - Copy all logs from changing language
2. **Check file versions** - Ensure all files have latest changes
3. **Try different language** - Switch between all 4 languages
4. **Check network** - Ensure no network issues blocking updates
5. **Restart device** - Sometimes helps with React Native caching

## 💡 Common Issues

### Issue: Only one element updates
**Cause:** Component not re-rendering
**Fix:** Add `key={_key}` to root element

### Issue: Nothing updates
**Cause:** LanguageContext not triggering
**Fix:** Check LanguageProvider is wrapping app

### Issue: Translations wrong in console
**Cause:** i18n locale not changing
**Fix:** Check `changeAppLanguage` function

### Issue: Works on reload but not on language change
**Cause:** Component not responding to context changes
**Fix:** Ensure using `useTranslation()` hook, not direct `i18n.t()`

## ✅ Success Indicators

You'll know it's working when:
- Console shows key incrementing
- Console shows translations in new language
- UI updates immediately
- All text changes, not just one element
- Tab bar updates
- Works for all 4 languages

---

**Next Steps:**
1. Clear Metro cache: `npx expo start --clear`
2. Change language
3. Check console logs
4. Share output if still not working
