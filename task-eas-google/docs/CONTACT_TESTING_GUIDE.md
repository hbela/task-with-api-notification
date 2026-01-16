# Contact Management - Quick Start & Testing Guide

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd server
npm run dev
```

The server should start on `http://localhost:3001` (or your configured port).

### 2. Start the Mobile App
```bash
# From the root directory
npm start

# Or use Expo CLI
npx expo start
```

### 3. Build the App (if needed)
If you've added new native modules, rebuild:
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## 📱 Testing the Contact Feature

### Test 1: Create a New Contact

1. **Open the app** and navigate to the **Contacts** tab
2. **Tap the "+" button** in the top right
3. **Fill in the contact form**:
   - Full Name: "John Doe" (required)
   - Phone: "+1234567890"
   - Email: "john@example.com"
   - Company: "Acme Corp"
   - Address: "123 Main St, New York, NY"
4. **Tap "Save"**
5. **Expected Results**:
   - Contact appears in the contacts list
   - Sync status shows "Synced" (green checkmark)
   - Contact appears in your device's address book
   - Success alert is displayed

### Test 2: Search Contacts

1. **Go to Contacts tab**
2. **Tap the search bar**
3. **Type "John"**
4. **Expected Results**:
   - List filters to show only matching contacts
   - Search works on name, phone, email, and company

### Test 3: Link Contact to Task

1. **Go to Create tab**
2. **Fill in task details**:
   - Title: "Fix computer"
   - Description: "Repair John's laptop"
3. **Tap "Select Contact"**
4. **Search and select "John Doe"**
5. **Expected Results**:
   - Contact info displays in the task form
   - Contact's address shows as a hint
6. **Save the task**
7. **Expected Results**:
   - Task is created with contact link
   - Task appears in task list with contact info

### Test 4: View Contact with Tasks

1. **Go to Contacts tab**
2. **Tap on "John Doe"**
3. **Expected Results**:
   - Contact details display
   - "Associated Tasks" section shows the task
   - Sync status is visible
   - Can tap task to view it

### Test 5: Edit Contact

1. **Open "John Doe" contact**
2. **Modify the phone number** to "+0987654321"
3. **Tap "Save"**
4. **Expected Results**:
   - Contact updates successfully
   - Device contact is updated
   - Sync status updates

### Test 6: Delete Contact (with validation)

1. **Try to delete "John Doe"** (who has a task)
2. **Expected Results**:
   - Error message: "Cannot delete contact with associated tasks"
   - Contact is NOT deleted
3. **Delete the associated task first**
4. **Try deleting contact again**
5. **Expected Results**:
   - Confirmation dialog appears
   - Contact is deleted
   - Removed from device contacts

## 🔍 Verification Checklist

### Backend API Tests

Test using Postman or curl:

```bash
# 1. Create Contact
curl -X POST http://localhost:3001/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "phone": "+1555123456",
    "email": "jane@example.com",
    "company": "Tech Corp"
  }'

# 2. Get All Contacts
curl http://localhost:3001/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Search Contacts
curl "http://localhost:3001/contacts?search=Jane" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Get Contact by ID
curl http://localhost:3001/contacts/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Update Contact
curl -X PATCH http://localhost:3001/contacts/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1555999888"}'

# 6. Update Sync Status
curl -X PATCH http://localhost:3001/contacts/1/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceContactId": "device_123",
    "syncStatus": "synced"
  }'

# 7. Search by Phone
curl "http://localhost:3001/contacts/search/phone?phone=%2B1555123456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 8. Create Task with Contact
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting",
    "description": "Discuss project",
    "contactId": 1,
    "dueDate": "2026-01-20T10:00:00Z"
  }'
```

### Device Sync Tests

1. **Create contact in app** → Check device contacts app
2. **Update contact in app** → Verify device contact updates
3. **Check sync status** → Should show "Synced"
4. **Test permissions**:
   - Deny contacts permission → Should show error
   - Grant permission → Should sync successfully

### Edge Cases to Test

- [ ] Create contact without phone/email
- [ ] Create contact with duplicate phone
- [ ] Create contact with invalid email
- [ ] Search with no results
- [ ] Delete contact with tasks (should fail)
- [ ] Update contact to empty required fields
- [ ] Test with no internet connection
- [ ] Test with device contacts permission denied
- [ ] Test with very long contact names
- [ ] Test with special characters in names

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/types/contact'"
**Solution**: TypeScript server needs to reload. Restart VS Code or reload the window.

### Issue: Contacts not syncing to device
**Checks**:
1. Verify permissions are granted
2. Check device contacts app
3. Look for sync status errors
4. Check console logs for errors

### Issue: "Contact not found" error
**Checks**:
1. Verify user is authenticated
2. Check contact belongs to current user
3. Verify contact ID is correct

### Issue: Cannot delete contact
**Reason**: Contact has associated tasks
**Solution**: Delete or unlink tasks first

### Issue: Search not working
**Checks**:
1. Verify search query is correct
2. Check network connection
3. Look for API errors in console

## 📊 Expected Database State

After running all tests, your database should have:

```sql
-- Contacts table
SELECT * FROM "Contact";
-- Should show contacts with sync status

-- Tasks table with contacts
SELECT t.*, c."fullName" as contact_name 
FROM "Task" t 
LEFT JOIN "Contact" c ON t."contactId" = c.id;
-- Should show tasks linked to contacts

-- Check sync status distribution
SELECT "syncStatus", COUNT(*) 
FROM "Contact" 
GROUP BY "syncStatus";
-- Should show mostly "synced" status
```

## ✅ Success Criteria

The feature is working correctly if:

- ✅ Can create, read, update, delete contacts
- ✅ Contacts sync to device address book
- ✅ Can search contacts by name, phone, email
- ✅ Can link contacts to tasks
- ✅ Sync status displays correctly
- ✅ Cannot delete contacts with tasks
- ✅ Permissions are handled gracefully
- ✅ UI is responsive and intuitive
- ✅ Error messages are clear
- ✅ Loading states display properly

## 🎯 Performance Benchmarks

Expected performance:
- Contact list load: < 500ms
- Contact creation: < 1s
- Device sync: < 2s
- Search results: < 300ms
- Contact detail load: < 200ms

## 📝 Notes

- Device sync is **one-way** (App → Device)
- Contacts are matched by phone number or email
- Sync status updates automatically
- All operations require authentication
- Contacts are user-specific (isolated per user)

---

**Happy Testing!** 🎉

If you encounter any issues, check the console logs and network tab for detailed error messages.
