# Database Migration Guide - Adding Priority and DueDate

## ✅ Changes Made

### Frontend
- ✅ Updated `types/task.ts` with `TaskPriority` type
- ✅ Added `priority` field to Task interface
- ✅ Added `priority` and `dueDate` to CreateTaskInput
- ✅ UpdateTaskInput inherits these fields automatically

### Backend
- ✅ Updated Prisma schema with new fields
- ✅ Updated enhanced task routes to handle priority and dueDate
- ✅ Added filtering by priority
- ✅ Added sorting by createdAt, dueDate, or priority
- ✅ Added validation for priority values

## 🗄️ Database Migration

### Step 1: Run Prisma Migration

```bash
cd server
npx prisma migrate dev --name add_priority_and_duedate
```

This will:
1. Create a new migration file
2. Apply the changes to your database
3. Regenerate Prisma Client

### Step 2: Verify Migration

```bash
npx prisma studio
```

Check that the Task table now has:
- `priority` (String, default: "medium")
- `dueDate` (DateTime, nullable)
- `notificationId` (String, nullable)

## 📊 New Fields

### Priority Field
- **Type**: String (enum-like)
- **Values**: `low`, `medium`, `high`, `urgent`
- **Default**: `medium`
- **Indexed**: Yes (for fast filtering)

### DueDate Field
- **Type**: DateTime
- **Nullable**: Yes
- **Indexed**: Yes (for sorting)
- **Used for**: Scheduling notifications

### NotificationId Field
- **Type**: String
- **Nullable**: Yes
- **Used for**: Tracking scheduled notifications

## 🔧 API Updates

### GET /tasks - New Query Parameters

```typescript
// Filter by priority
GET /tasks?priority=high

// Sort by due date
GET /tasks?sortBy=dueDate&sortOrder=asc

// Sort by priority
GET /tasks?sortBy=priority&sortOrder=desc

// Combined filters
GET /tasks?status=pending&priority=urgent&sortBy=dueDate
```

### POST /tasks - New Fields

```typescript
{
  "title": "Important Task",
  "description": "This needs to be done soon",
  "priority": "urgent",  // NEW
  "dueDate": "2026-01-15T14:00:00Z"  // NEW
}
```

### PATCH /tasks/:id - New Fields

```typescript
{
  "priority": "high",  // NEW
  "dueDate": "2026-01-16T10:00:00Z",  // NEW
  "notificationId": "abc123"  // NEW (set by notification service)
}
```

## 🎨 Priority Levels

### Visual Representation

```typescript
const priorityColors = {
  low: '#34C759',      // Green
  medium: '#007AFF',   // Blue
  high: '#FF9500',     // Orange
  urgent: '#FF3B30',   // Red
};

const priorityIcons = {
  low: 'arrow-down',
  medium: 'minus',
  high: 'arrow-up',
  urgent: 'alert-circle',
};
```

## 📝 Usage Examples

### Create Task with Priority and Due Date

```typescript
const newTask = await createTask({
  title: "Submit Report",
  description: "Q4 financial report",
  priority: "urgent",
  dueDate: new Date('2026-01-15T17:00:00').toISOString(),
});
```

### Filter Tasks by Priority

```typescript
const urgentTasks = await fetchTasks({
  page: 1,
  priority: 'urgent',
  sortBy: 'dueDate',
  sortOrder: 'asc',
});
```

### Update Task Priority

```typescript
await updateTask(taskId, {
  priority: 'high',
  dueDate: new Date('2026-01-20T12:00:00').toISOString(),
});
```

## 🧪 Testing the Migration

### 1. Test Priority Filtering

```bash
# Create tasks with different priorities
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Low Priority Task", "priority": "low"}'

curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Urgent Task", "priority": "urgent"}'

# Filter by priority
curl "http://localhost:3001/tasks?priority=urgent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Due Date Sorting

```bash
# Get tasks sorted by due date
curl "http://localhost:3001/tasks?sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Combined Filters

```bash
# Get urgent pending tasks sorted by due date
curl "http://localhost:3001/tasks?status=pending&priority=urgent&sortBy=dueDate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Updating Existing Tasks

All existing tasks will automatically get:
- `priority`: `"medium"` (default value)
- `dueDate`: `null`
- `notificationId`: `null`

No manual data migration needed!

## ✅ Pre-Build Checklist

Before running `eas build`:

- [x] Prisma schema updated
- [x] Frontend types updated
- [x] Backend routes updated
- [ ] Database migration run (`npx prisma migrate dev`)
- [ ] Prisma client regenerated (happens automatically with migration)
- [ ] Backend server restarted
- [ ] Test priority filtering
- [ ] Test due date sorting

## 🚀 Ready to Build!

Once you've run the migration, everything is ready for the EAS build:

```bash
# Run migration first
cd server
npx prisma migrate dev --name add_priority_and_duedate

# Restart server
npm run dev

# Then build the app
cd ..
eas build --profile development --platform android
```

## 📚 Next Steps

After the build:
1. Test priority filtering in the app
2. Test due date sorting
3. Implement UI for priority selection (dropdown/picker)
4. Implement UI for due date selection (date picker)
5. Add priority badges to TaskCard component
6. Add due date display to TaskCard component

---

**Status**: ✅ Code ready, migration pending
**Next**: Run `npx prisma migrate dev` in server directory
