# Backend Changes for Simplified Contact Management

## Database Migration

### SQL Migration Script

```sql
-- Change contactId from INTEGER to VARCHAR to support device contact IDs
ALTER TABLE tasks 
MODIFY COLUMN contactId VARCHAR(255) NULL;

-- Optional: Add index for better query performance
CREATE INDEX idx_tasks_contactId ON tasks(contactId);
```

### Rollback Script (if needed)

```sql
-- Remove index
DROP INDEX idx_tasks_contactId ON tasks;

-- Revert to INTEGER (will lose data if any string IDs exist)
ALTER TABLE tasks 
MODIFY COLUMN contactId INTEGER NULL;
```

## API Schema Updates

### Task Model (TypeScript/Prisma Example)

```typescript
model Task {
  id            Int       @id @default(autoincrement())
  title         String
  description   String?
  completed     Boolean   @default(false)
  priority      String    @default("medium")
  userId        Int
  dueDate       DateTime?
  notificationId String?
  reminderTimes Int[]?
  contactId     String?   // Changed from Int to String
  taskAddress   String?
  latitude      Float?
  longitude     Float?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id])
}
```

### API Validation

Update your validation schemas to accept string contactId:

```typescript
// Example with Zod
const createTaskSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  reminderTimes: z.array(z.number()).optional(),
  contactId: z.string().optional(), // Changed from z.number() to z.string()
  taskAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const updateTaskSchema = createTaskSchema.partial();
```

## API Response Changes

### Before (with contact object)
```json
{
  "task": {
    "id": 1,
    "title": "Meeting with John",
    "contactId": 123,
    "contact": {
      "id": 123,
      "fullName": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    }
  }
}
```

### After (contactId only)
```json
{
  "task": {
    "id": 1,
    "title": "Meeting with John",
    "contactId": "E494C2E4-A5E6-4E5D-B1E2-5B6F7C8D9E0F"
  }
}
```

**Note:** The `contact` object is no longer returned. The mobile app will fetch contact details from the device using the `contactId`.

## Endpoints to Update

### POST /tasks
```typescript
// Before
{
  "contactId": 123  // number
}

// After
{
  "contactId": "E494C2E4-A5E6-4E5D-B1E2-5B6F7C8D9E0F"  // string
}
```

### PUT /tasks/:id
Same as POST - accepts string contactId

### GET /tasks/:id
Returns string contactId (no contact object)

### GET /tasks
Returns tasks with string contactId (no contact objects)

## Remove Unused Endpoints

If you had these contact-related endpoints, they can be removed:

- ❌ `GET /contacts` - No longer needed
- ❌ `POST /contacts` - No longer needed
- ❌ `PUT /contacts/:id` - No longer needed
- ❌ `DELETE /contacts/:id` - No longer needed
- ❌ `POST /contacts/sync` - No longer needed

## Code Cleanup

### Remove Contact-Related Code

1. **Models**: Remove `Contact` model if it exists
2. **Routes**: Remove contact routes
3. **Controllers**: Remove contact controllers
4. **Services**: Remove contact sync services
5. **Database Tables**: Drop `contacts` table if it exists

```sql
-- Drop contacts table (if it exists)
DROP TABLE IF EXISTS contacts;
```

## Testing the Changes

### Test Cases

1. **Create task with contactId**
```bash
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Meeting with John",
    "contactId": "E494C2E4-A5E6-4E5D-B1E2-5B6F7C8D9E0F"
  }'
```

2. **Update task contactId**
```bash
curl -X PUT http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contactId": "NEW-CONTACT-ID-HERE"
  }'
```

3. **Remove contactId from task**
```bash
curl -X PUT http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contactId": null
  }'
```

4. **Get task with contactId**
```bash
curl -X GET http://localhost:3001/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "task": {
    "id": 1,
    "title": "Meeting with John",
    "contactId": "E494C2E4-A5E6-4E5D-B1E2-5B6F7C8D9E0F",
    "createdAt": "2026-01-16T10:00:00Z",
    ...
  }
}
```

## Deployment Checklist

- [ ] Backup database before migration
- [ ] Run database migration script
- [ ] Update API validation schemas
- [ ] Remove contact-related endpoints
- [ ] Remove contact model/table
- [ ] Update API documentation
- [ ] Test all task CRUD operations
- [ ] Deploy backend changes
- [ ] Deploy mobile app update
- [ ] Monitor for errors

## Rollback Plan

If issues occur:

1. **Revert API code** to previous version
2. **Run rollback migration** (if no string contactIds were created)
3. **Restore contacts table** from backup (if needed)
4. **Redeploy previous mobile app** version

## Notes

- **Breaking Change**: This is a breaking change for the API
- **Version**: Consider versioning your API (e.g., `/v2/tasks`)
- **Migration**: Existing numeric contactIds will need to be handled (either cleared or mapped)
- **Coordination**: Deploy backend and mobile app updates together
