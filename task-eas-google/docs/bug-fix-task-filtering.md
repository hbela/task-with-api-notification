# Bug Fix - Task Filtering (Pending/Completed)

## Issue
The pending and completed filter buttons on the task list were not working. Clicking any filter showed all tasks instead of filtering by completion status.

## Root Cause
The backend GET /tasks endpoint was not accepting or handling the `status` query parameter. It was ignoring the filter and always returning all tasks.

## The Problem Code

**Backend** (`server/src/routes/tasks.ts`):
```typescript
// Before - No filtering support
fastify.get('/tasks', async (request, reply) => {
  const tasks = await prisma.task.findMany({
    where: { userId: request.currentUser.id },  // ❌ No status filter
    orderBy: { createdAt: 'desc' },
  });
  return { tasks };
});
```

**Frontend** was correctly sending the status parameter:
```typescript
// Frontend was doing this correctly
useTasks({
  status: filter === 'all' ? undefined : filter  // 'pending' or 'completed'
});
```

But the backend was ignoring it!

## The Fix

**Backend** (`server/src/routes/tasks.ts`):
```typescript
// After - With filtering support
fastify.get<{
  Querystring: {
    status?: 'pending' | 'completed';
    page?: string;
    limit?: string;
  };
}>('/tasks', async (request, reply) => {
  const { status } = request.query;

  // Build where clause
  const where: any = {
    userId: request.currentUser.id,
  };

  // Add status filter if provided
  if (status === 'completed') {
    where.completed = true;
  } else if (status === 'pending') {
    where.completed = false;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return { tasks };
});
```

## How It Works Now

### Filter: All
- Frontend: `status: undefined`
- Backend: No completion filter
- Result: Returns all tasks ✅

### Filter: Pending
- Frontend: `status: 'pending'`
- Backend: `where.completed = false`
- Result: Returns only incomplete tasks ✅

### Filter: Completed
- Frontend: `status: 'completed'`
- Backend: `where.completed = true`
- Result: Returns only completed tasks ✅

## API Endpoint Updated

**GET /tasks**
```
Query Parameters:
  - status?: 'pending' | 'completed'  // NEW: Filter by completion status
  - page?: string                     // For future pagination
  - limit?: string                    // For future pagination

Response:
  {
    "tasks": Task[]
  }
```

## User Flow

1. User opens task list
2. Sees "All", "Pending", "Completed" filter chips
3. Taps "Pending"
4. ✅ Frontend sends `?status=pending` to API
5. ✅ Backend filters: `where.completed = false`
6. ✅ Only pending tasks returned
7. ✅ TanStack Query caches result with filter key
8. User taps "Completed"
9. ✅ Frontend sends `?status=completed` to API
10. ✅ Backend filters: `where.completed = true`
11. ✅ Only completed tasks returned
12. ✅ New query cached separately

## TanStack Query Integration

The filtering works perfectly with TanStack Query because:

```typescript
// Each filter creates a unique query key
useTasks({ status: 'pending' })    // Key: ['tasks', 'list', { status: 'pending' }]
useTasks({ status: 'completed' })  // Key: ['tasks', 'list', { status: 'completed' }]
useTasks({ status: undefined })    // Key: ['tasks', 'list', {}]
```

Each filter is cached separately, so switching between filters is instant!

## Files Modified
- ✅ `server/src/routes/tasks.ts` - Added status filtering to GET /tasks

## Testing Checklist

Test these scenarios:
- ✅ Click "All" - shows all tasks
- ✅ Click "Pending" - shows only incomplete tasks
- ✅ Click "Completed" - shows only completed tasks
- ✅ Create a task - appears in "All" and "Pending"
- ✅ Mark task complete - moves from "Pending" to "Completed"
- ✅ Mark task incomplete - moves from "Completed" to "Pending"
- ✅ Delete task - removed from all filters
- ✅ Switching filters is instant (cached)

## Summary

The filtering now works perfectly:
1. ✅ Backend accepts and handles status parameter
2. ✅ Frontend sends correct filter value
3. ✅ TanStack Query caches each filter separately
4. ✅ Instant filter switching (cached results)
5. ✅ All three filters work: All, Pending, Completed

The task list filtering is now fully functional! 🎉
