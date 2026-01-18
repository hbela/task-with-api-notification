# 🚀 i18n Quick Reference

## Import and Use

```typescript
// Import the hook
import { useTranslation } from '@/hooks/useTranslation';

// In your component
const { t } = useTranslation();

// Use translations
<Text>{t('tasks.title')}</Text>
<Text>{t('common.save')}</Text>
```

## Date Formatting

```typescript
import { formatTaskDueDate, formatDateTime, formatDate } from '@/utils/dateFormatter';

// Relative dates (Today, Tomorrow, etc.)
formatTaskDueDate(task.dueDate)

// Full date and time
formatDateTime(task.createdAt)

// Custom format
formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })
```

## Common Translation Keys

```typescript
// Tasks
t('tasks.title')          // "My Tasks"
t('tasks.create')         // "Add New Task"
t('tasks.empty')          // "No tasks yet"
t('tasks.completed')      // "Completed"
t('tasks.pending')        // "Pending"

// Common UI
t('common.save')          // "Save"
t('common.cancel')        // "Cancel"
t('common.delete')        // "Delete"
t('common.loading')       // "Loading..."
t('common.success')       // "Success"

// Settings
t('settings.title')       // "Settings"
t('settings.language')    // "Language"

// Dates
t('date.today')           // "Today"
t('date.tomorrow')        // "Tomorrow"
t('date.yesterday')       // "Yesterday"
```

## Adding New Translations

1. Add to `translations/en.json`:
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

2. Add to `translations/hu.json`, `fr.json`, `de.json`

3. Use in component:
```typescript
<Text>{t('myFeature.title')}</Text>
```

## Language Switcher

Already available in Settings screen (`app/(tabs)/settings.tsx`)

## Supported Languages

- 🇺🇸 English (en)
- 🇭🇺 Hungarian (hu)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)

## Full Documentation

See `docs/i18n-implementation-guide.md` for complete details.
