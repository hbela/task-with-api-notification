# Expo Localization Configuration & Usage

## Installation Status
✅ **expo-localization** has been successfully installed and configured!

The package has been:
- Installed via `npx expo install expo-localization`
- Added to the plugins array in `app.json`

## Basic Usage

### 1. Get Device Locale Information

```typescript
import * as Localization from 'expo-localization';

// Get the device's locale
const locale = Localization.getLocales()[0];
console.log('Locale:', locale);
// Example output: { languageCode: 'en', regionCode: 'US', languageTag: 'en-US', ... }

// Get timezone
const timezone = Localization.getCalendars()[0].timeZone;
console.log('Timezone:', timezone);
// Example output: 'America/New_York'
```

### 2. Integration with i18n Libraries

#### Example with i18next

```typescript
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      tasks: 'Tasks',
      addTask: 'Add Task',
      dueDate: 'Due Date',
    }
  },
  fr: {
    translation: {
      welcome: 'Bienvenue',
      tasks: 'Tâches',
      addTask: 'Ajouter une tâche',
      dueDate: 'Date d\'échéance',
    }
  },
  es: {
    translation: {
      welcome: 'Bienvenido',
      tasks: 'Tareas',
      addTask: 'Agregar tarea',
      dueDate: 'Fecha de vencimiento',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode, // Use device language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### 3. Practical Example for Your Task App

Create a new file: `utils/localization.ts`

```typescript
import * as Localization from 'expo-localization';

export const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  return locales[0];
};

export const getLanguageCode = () => {
  return getDeviceLocale().languageCode || 'en';
};

export const getRegionCode = () => {
  return getDeviceLocale().regionCode || 'US';
};

export const getTimezone = () => {
  const calendars = Localization.getCalendars();
  return calendars[0]?.timeZone || 'UTC';
};

export const formatDateForLocale = (date: Date) => {
  const locale = getDeviceLocale();
  return new Intl.DateTimeFormat(locale.languageTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getCurrencyForRegion = () => {
  const regionCode = getRegionCode();
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'FR': 'EUR',
    'DE': 'EUR',
    'ES': 'EUR',
    'JP': 'JPY',
    'CN': 'CNY',
    // Add more as needed
  };
  return currencyMap[regionCode] || 'USD';
};
```

### 4. Using Localization in Components

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getDeviceLocale, formatDateForLocale, getTimezone } from '@/utils/localization';

export default function LocaleInfo() {
  const [locale, setLocale] = useState<any>(null);
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    setLocale(getDeviceLocale());
    setTimezone(getTimezone());
  }, []);

  if (!locale) return null;

  return (
    <View>
      <Text>Language: {locale.languageCode}</Text>
      <Text>Region: {locale.regionCode}</Text>
      <Text>Locale Tag: {locale.languageTag}</Text>
      <Text>Timezone: {timezone}</Text>
      <Text>Current Time: {formatDateForLocale(new Date())}</Text>
    </View>
  );
}
```

### 5. Date Formatting with Locale Awareness

For your task app's due dates:

```typescript
import { getDeviceLocale } from '@/utils/localization';

export const formatTaskDueDate = (dueDate: string | Date) => {
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const locale = getDeviceLocale();
  
  return new Intl.DateTimeFormat(locale.languageTag, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Usage in TaskCard component:
// <Text>{formatTaskDueDate(task.dueDate)}</Text>
```

## Available APIs

### `Localization.getLocales()`
Returns an array of locale objects with:
- `languageCode`: ISO 639-1 language code (e.g., 'en', 'fr')
- `regionCode`: ISO 3166-1 alpha-2 region code (e.g., 'US', 'FR')
- `languageTag`: BCP 47 language tag (e.g., 'en-US', 'fr-FR')
- `textDirection`: 'ltr' or 'rtl'
- `digitGroupingSeparator`: Character used for grouping digits
- `decimalSeparator`: Character used for decimal point

### `Localization.getCalendars()`
Returns calendar information including:
- `calendar`: Calendar identifier (e.g., 'gregorian')
- `timeZone`: IANA timezone (e.g., 'America/New_York')
- `uses24hourClock`: Boolean indicating 24-hour format preference
- `firstWeekday`: Number (1-7) indicating first day of week

### `Localization.getLocalizationAsync()`
Async version that returns both locale and calendar information.

## Next Steps

1. **For Multi-language Support**: Install `i18next` and `react-i18next`
   ```bash
   npm install i18next react-i18next
   ```

2. **Create Translation Files**: Organize translations in `locales/` folder
   ```
   locales/
     en.json
     fr.json
     es.json
   ```

3. **Update Your Components**: Use locale-aware date formatting in task lists

4. **Test Different Locales**: Change device language settings to test

## Important Notes

- The plugin is already configured in `app.json`
- **Rebuild required**: Since this is a native module, you'll need to rebuild your app:
  ```bash
  npx expo prebuild --clean
  npx expo run:android
  # or
  npx expo run:ios
  ```
- Changes to locale settings are detected automatically when the app restarts
- For web, localization uses browser settings

## Resources

- [Expo Localization Docs](https://docs.expo.dev/versions/latest/sdk/localization/)
- [Intl API (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [i18next Documentation](https://www.i18next.com/)
