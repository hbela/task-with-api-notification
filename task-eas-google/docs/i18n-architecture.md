# 🏗️ i18n Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App Root                             │
│                      (_layout.tsx)                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            LanguageProvider                          │   │
│  │         (context/LanguageContext.tsx)                │   │
│  │                                                       │   │
│  │  • Manages language state (key)                      │   │
│  │  • Provides refreshApp() function                    │   │
│  │  • Initializes locale on app start                   │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          All App Components                          │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │   Tabs       │  │   Settings   │  │  Custom   │ │   │
│  │  │   Layout     │  │   Screen     │  │Components │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                       │   │
│  │  All use:                                            │   │
│  │  • useTranslation() hook                             │   │
│  │  • i18n.t('key') for translations                    │   │
│  │  • formatDate() for dates                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Changes Language
         │
         ▼
┌────────────────────┐
│ LanguageSwitcher   │
│ (UI Component)     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ changeAppLanguage()│
│ (i18n.ts)          │
│                    │
│ 1. Update locale   │
│ 2. Save to Storage │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ refreshApp()       │
│ (LanguageContext)  │
│                    │
│ Increment key      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ All Components     │
│ Re-render          │
│                    │
│ New translations   │
│ appear instantly   │
└────────────────────┘
```

## File Structure

```
task-eas-google/
│
├── 📄 i18n.ts                    # Core configuration
│   ├── Imports translations
│   ├── Configures i18n-js
│   ├── Device locale detection
│   └── AsyncStorage persistence
│
├── 📁 translations/              # Translation files
│   ├── en.json                   # English
│   ├── hu.json                   # Hungarian
│   ├── fr.json                   # French
│   └── de.json                   # German
│
├── 📁 context/
│   └── LanguageContext.tsx       # Global state
│       ├── LanguageProvider
│       ├── refreshApp()
│       └── key state
│
├── 📁 hooks/
│   └── useTranslation.ts         # Custom hook
│       └── Returns { t, locale, _key }
│
├── 📁 utils/
│   └── dateFormatter.ts          # Date utilities
│       ├── formatDate()
│       ├── formatDateTime()
│       ├── formatTaskDueDate()
│       └── formatTime()
│
├── 📁 components/
│   └── LanguageSwitcher.tsx      # UI component
│       ├── Language options
│       ├── Flag emojis
│       └── Active state
│
└── 📁 app/
    ├── _layout.tsx               # Wrapped with Provider
    └── (tabs)/
        ├── _layout.tsx           # Localized tab titles
        └── settings.tsx          # Settings screen
```

## Translation Lookup

```
Component calls:
  t('tasks.title')
         │
         ▼
┌────────────────────┐
│ i18n.t()           │
│ (i18n-js library)  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Check locale       │
│ (e.g., 'hu')       │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Load translation   │
│ from hu.json       │
│                    │
│ {                  │
│   "tasks": {       │
│     "title": "..." │
│   }                │
│ }                  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Return translated  │
│ string             │
│ "Feladataim"       │
└────────────────────┘
```

## Component Integration Pattern

```typescript
// 1. Import the hook
import { useTranslation } from '@/hooks/useTranslation';

// 2. Use in component
function MyComponent() {
  const { t } = useTranslation();
  
  // 3. Component automatically re-renders when language changes
  return (
    <View>
      <Text>{t('key')}</Text>
    </View>
  );
}
```

## Storage Flow

```
App Launch
    │
    ▼
┌─────────────────┐
│ loadSavedLocale │
│ (i18n.ts)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AsyncStorage    │
│ .getItem()      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Saved?      No saved
locale      preference
    │         │
    │         ▼
    │    Use device
    │    locale
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Set i18n.locale │
└─────────────────┘
```

## Key Components

### 1. LanguageProvider
- Wraps entire app
- Provides context
- Manages re-render key

### 2. i18n Instance
- Singleton configuration
- Manages translations
- Handles fallbacks

### 3. useTranslation Hook
- Connects to context
- Returns translation function
- Ensures re-renders

### 4. LanguageSwitcher
- User interface
- Triggers changes
- Shows current language

## Benefits

✅ **Centralized**: All translations in one place
✅ **Type-safe**: TypeScript support
✅ **Persistent**: Saves user preference
✅ **Automatic**: Device locale detection
✅ **Dynamic**: Instant language switching
✅ **Scalable**: Easy to add languages
✅ **Developer-friendly**: Simple API

## Next Steps

1. Update existing components to use `t()`
2. Replace hardcoded dates with formatters
3. Add more translation keys as needed
4. Test all languages thoroughly
