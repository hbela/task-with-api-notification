# 🔧 Final Solution: Force Text Re-render with extraData

## 🐛 The Problem

React Native's `Text` component caches rendered text and doesn't always update when the content changes, even when the component re-renders. This is a known React Native issue.

**Evidence:**
- Console shows correct translations: `"Mes tâches"`, `"Rechercher des tâches..."`
- Component re-renders (key changes: 0 → 1)
- But UI still shows old text

## ✅ Solution: Use FlatList extraData

The `FlatList` component has an `extraData` prop that forces it to re-render when data changes. We can use this pattern for the entire screen.

### Apply This Fix:

**File:** `app/(app)/index.tsx`

Add `extraData={_key}` to the FlatList:

```typescript
<FlatList
  key={`task-list-${_key}`}
  data={filteredTasks}
  renderItem={renderTask}
  keyExtractor={(item) => `task-${item.id}-${_key}`}
  contentContainerStyle={styles.listContent}
  ListEmptyComponent={renderEmpty}
  extraData={_key}  // ← ADD THIS LINE
  refreshControl={
    <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
  }
/>
```

## 🎯 Alternative: Force Text Update with State

If extraData doesn't work, we need to force Text components to update by making them depend on state:

```typescript
const [forceUpdate, setForceUpdate] = useState(0);

useEffect(() => {
  setForceUpdate(prev => prev + 1);
}, [_key]);

// Then in render:
<Text>{t('tasks.title')} {forceUpdate ? '' : ''}</Text>
```

## 🔄 Nuclear Option: Unmount Entire Screen

If nothing else works, we can unmount the entire screen component when language changes:

**File:** `app/(app)/_layout.tsx`

Wrap the entire Tabs in a component that remounts:

```typescript
return _key % 2 === 0 ? (
  <Tabs screenOptions={screenOptions}>
    {/* all tabs */}
  </Tabs>
) : (
  <Tabs screenOptions={screenOptions}>
    {/* all tabs */}
  </Tabs>
);
```

This creates two separate instances that alternate based on the key.

## 📝 Summary

This is a React Native Text rendering bug, not a translation issue. The JavaScript has the correct translations, but the native UI isn't updating.

**Try these in order:**
1. Add `extraData={_key}` to FlatList
2. Use state-based force update
3. Unmount/remount entire screen
4. As last resort: navigate away and back (which we're already doing)

The fact that it works on reload but not on language change confirms this is a native view caching issue.
