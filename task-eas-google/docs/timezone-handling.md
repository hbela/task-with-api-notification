# Timezone Handling in Notifications

## ✅ How Timezones Work in This App

Your app **automatically handles timezones correctly**! Here's how:

### 1. Date Storage (Backend - PostgreSQL)

Dates are stored as **UTC timestamps** in the database:

```sql
-- Task table
dueDate TIMESTAMP  -- Stored in UTC
```

Example:
- You set due date: **16:00 CET** (Central European Time)
- Stored in DB: **15:00 UTC** (automatically converted)

### 2. Date Transmission (API)

Dates are transmitted as **ISO 8601 strings** in UTC:

```json
{
  "dueDate": "2026-01-14T15:00:00.000Z"
}
```

The `Z` at the end means UTC (Zero offset).

### 3. Date Display (Mobile App)

JavaScript's `Date` object **automatically converts to your local timezone**:

```typescript
const dueDate = new Date("2026-01-14T15:00:00.000Z");

// Display in your timezone (CET = UTC+1)
dueDate.toLocaleString()  // "1/14/2026, 4:00:00 PM"
dueDate.toLocaleDateString()  // "1/14/2026"
dueDate.toLocaleTimeString()  // "4:00:00 PM"
```

### 4. Notification Scheduling

Notifications use **device local time**, so they fire at the correct time in your timezone:

```typescript
// You're in CET (UTC+1)
// Task due: 16:00 CET (15:00 UTC)
// Reminder: 1 hour before

// Calculation:
const dueDate = new Date("2026-01-14T15:00:00.000Z");  // 16:00 CET
const triggerDate = new Date(dueDate.getTime() - 60 * 60 * 1000);  // 15:00 CET

// Notification fires at: 15:00 CET (your local time) ✅
```

## 🌍 Example: CET Timezone (UTC+1)

### Scenario: Create a task due at 4:00 PM today

**Your Input (in app):**
- Date picker shows: **January 14, 2026, 4:00 PM**
- Your timezone: **CET (UTC+1)**

**What Happens:**

1. **TaskForm converts to ISO string:**
   ```typescript
   dueDate.toISOString()  // "2026-01-14T15:00:00.000Z"
   ```

2. **Backend stores:**
   ```
   15:00:00 UTC (which is 16:00:00 CET)
   ```

3. **When fetching task:**
   ```typescript
   const task = { dueDate: "2026-01-14T15:00:00.000Z" };
   const date = new Date(task.dueDate);
   
   // Your device shows: 16:00 CET ✅
   ```

4. **When scheduling notification (1 hour before):**
   ```typescript
   // Due: 16:00 CET
   // Reminder: 15:00 CET
   // Notification fires at: 15:00 CET ✅
   ```

## 🔍 Debug Logs Now Show Timezone

With the latest update, you'll see timezone information in the logs:

```
[Scheduler] 📋 Scheduling reminders for task: {
  id: 123,
  title: "Test Task",
  dueDate: "2026-01-14T15:00:00.000Z",      // UTC
  dueDateLocal: "1/14/2026, 4:00:00 PM",    // CET
  timezone: "UTC+1",                         // Your timezone
  reminderTimes: [60]
}

[Scheduler] ⏰ Checking reminder 60 minutes before: {
  triggerDate: "2026-01-14T14:00:00.000Z",  // UTC
  triggerDateLocal: "1/14/2026, 3:00:00 PM", // CET
  now: "2026-01-14T14:56:00.000Z",          // UTC
  nowLocal: "1/14/2026, 3:56:00 PM",        // CET
  timezone: "UTC+1",
  isPast: false
}
```

## ✈️ Traveling to Different Timezones

### What Happens When You Travel?

**Scenario:** You create a task in CET, then travel to EST (UTC-5)

1. **Task created in CET:**
   - Due date: 16:00 CET
   - Stored: 15:00 UTC

2. **You travel to EST:**
   - Your device timezone changes to EST (UTC-5)
   - Same task now shows: 10:00 AM EST
   - Notification will fire at: 9:00 AM EST (1 hour before)

**The notification adjusts to your new timezone automatically!** ✅

### Why This Works

JavaScript's `Date` object uses **milliseconds since epoch** (January 1, 1970 UTC):

```typescript
const dueDate = new Date("2026-01-14T15:00:00.000Z");
dueDate.getTime()  // 1768390800000 (milliseconds since epoch)

// This number is the same everywhere in the world
// Display just changes based on device timezone
```

## 🎯 Best Practices

### ✅ DO:
- Use `toISOString()` when sending dates to the backend
- Use `new Date(isoString)` when receiving dates from the backend
- Let JavaScript handle timezone conversions automatically
- Use `toLocaleString()` for displaying dates to users

### ❌ DON'T:
- Manually add/subtract timezone offsets
- Use string manipulation for dates
- Assume dates are in a specific timezone
- Store dates as strings without timezone info

## 🧪 Testing Timezone Handling

### Test 1: Create Task and Check Logs

1. Create a task due in 1 hour
2. Check the logs - you should see:
   ```
   timezone: "UTC+1"
   dueDateLocal: "1/14/2026, 4:56:00 PM"  // Your local time
   ```

### Test 2: Change Device Timezone

1. Create a task due tomorrow at 10:00 AM CET
2. Change device timezone to EST
3. Open the task - it should now show 4:00 AM EST
4. Notification will fire at 3:00 AM EST (1 hour before)

## 📝 Summary

- ✅ **Storage**: UTC in database
- ✅ **Transmission**: ISO 8601 strings with UTC
- ✅ **Display**: Automatic conversion to device timezone
- ✅ **Notifications**: Fire at correct local time
- ✅ **Travel**: Automatically adjusts to new timezone

**You don't need to do anything special - it just works!** 🎉
