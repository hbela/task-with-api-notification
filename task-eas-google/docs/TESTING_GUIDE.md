# Testing Guide for Production-Ready Task CRUD App

## 🧪 Pre-Testing Checklist

### Environment Setup
- [ ] `.env` file has all required variables:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_WEB_CLIENT_ID`
- [ ] Backend server is running
- [ ] Database is accessible
- [ ] Google OAuth is configured correctly

### Dependencies
```bash
# Verify all dependencies are installed
npm install

# Check for any issues
npm list @react-native-async-storage/async-storage
npm list expo-secure-store
npm list @react-native-google-signin/google-signin
```

## 📱 Testing Scenarios

### 1. Authentication Flow

#### Test 1.1: First-Time Login
1. Launch the app (fresh install)
2. **Expected**: Should show login screen
3. Tap "Continue with Google"
4. **Expected**: Google Sign-In sheet appears
5. Select Google account
6. **Expected**: 
   - Redirects to app
   - Shows tasks screen (empty state)
   - User name appears in header

#### Test 1.2: Persistent Login
1. Close the app completely
2. Reopen the app
3. **Expected**: 
   - Shows loading spinner briefly
   - Automatically logs in
   - Goes directly to tasks screen

#### Test 1.3: Logout
1. Go to Profile tab
2. Tap "Logout" button
3. Confirm logout
4. **Expected**:
   - Returns to login screen
   - All local data cleared

#### Test 1.4: Token Refresh
1. Login to the app
2. Wait for 15+ minutes (token expiration)
3. Perform any API action (create task, fetch tasks)
4. **Expected**:
   - Token refreshes automatically
   - Action completes successfully
   - No logout or error

### 2. Task CRUD Operations

#### Test 2.1: Create Task
1. Go to "Create" tab
2. Leave title empty, tap "Create Task"
3. **Expected**: Validation error "Title is required"
4. Enter title: "Test Task"
5. Enter description: "This is a test"
6. Tap "Create Task"
7. **Expected**:
   - Success message
   - Redirects to tasks list
   - New task appears at top

#### Test 2.2: View Task List
1. Go to "Tasks" tab
2. **Expected**:
   - All tasks displayed
   - Search bar visible
   - Filter chips visible (All, Pending, Completed)
   - Tasks show title, description, date

#### Test 2.3: View Task Detail
1. Tap on a task card
2. **Expected**:
   - Shows task detail screen
   - Displays full title and description
   - Shows creation/update dates
   - Shows status badge
   - Action buttons visible (Edit, Toggle, Delete)

#### Test 2.4: Edit Task
1. From task detail, tap "Edit Task"
2. **Expected**: Edit form with pre-filled data
3. Change title to "Updated Task"
4. Change description
5. Tap "Update Task"
6. **Expected**:
   - Success message
   - Returns to detail screen
   - Changes reflected

#### Test 2.5: Toggle Completion
1. From task list, tap checkbox on a task
2. **Expected**:
   - Task marked as completed
   - Visual changes (strikethrough, opacity)
   - Icon changes to checkmark
3. Tap checkbox again
4. **Expected**:
   - Task marked as pending
   - Visual changes revert

#### Test 2.6: Delete Task
1. From task detail, tap "Delete Task"
2. **Expected**: Confirmation dialog
3. Tap "Cancel"
4. **Expected**: Dialog closes, task remains
5. Tap "Delete Task" again
6. Tap "Delete"
7. **Expected**:
   - Returns to task list
   - Task removed from list

### 3. Search and Filter

#### Test 3.1: Search Tasks
1. Go to Tasks tab
2. Tap search bar
3. Type "test"
4. **Expected**:
   - List filters in real-time
   - Only matching tasks shown
5. Clear search
6. **Expected**: All tasks shown again

#### Test 3.2: Filter by Status
1. Create some completed and pending tasks
2. Tap "Pending" filter
3. **Expected**: Only pending tasks shown
4. Tap "Completed" filter
5. **Expected**: Only completed tasks shown
6. Tap "All" filter
7. **Expected**: All tasks shown

### 4. Pagination

#### Test 4.1: Infinite Scroll
1. Create 25+ tasks (or use existing data)
2. Scroll to bottom of list
3. **Expected**:
   - Loading indicator appears
   - More tasks load automatically
4. Continue scrolling
5. **Expected**: Loads until no more tasks

#### Test 4.2: Pull to Refresh
1. Pull down on task list
2. **Expected**:
   - Refresh indicator shows
   - List reloads
   - Returns to top

### 5. User Profile

#### Test 5.1: View Profile
1. Go to Profile tab
2. **Expected**:
   - User avatar displayed (or placeholder)
   - User name and email shown
   - Account information visible
   - Member since date shown
   - Last login date shown (if available)

### 6. Navigation

#### Test 6.1: Tab Navigation
1. Tap each tab (Tasks, Create, Profile)
2. **Expected**: Smooth transitions between tabs

#### Test 6.2: Back Navigation
1. Navigate: Tasks → Task Detail → Edit Task
2. Tap back button
3. **Expected**: Returns to Task Detail
4. Tap back again
5. **Expected**: Returns to Tasks list

#### Test 6.3: Deep Linking
1. Navigate to a task detail
2. Note the URL/route
3. Close and reopen app
4. **Expected**: Should maintain navigation state

### 7. Error Handling

#### Test 7.1: Network Error
1. Turn off WiFi/Data
2. Try to create a task
3. **Expected**: Error message displayed
4. Turn on WiFi/Data
5. Tap retry
6. **Expected**: Action succeeds

#### Test 7.2: Invalid Data
1. Try to create task with 300+ character title
2. **Expected**: Validation error or truncation

#### Test 7.3: Server Error
1. Stop backend server
2. Try to fetch tasks
3. **Expected**: 
   - Error message
   - Retry button available
4. Start server
5. Tap retry
6. **Expected**: Tasks load successfully

### 8. Edge Cases

#### Test 8.1: Empty States
1. Delete all tasks
2. **Expected**: 
   - Empty state message
   - "Create Task" button
   - Helpful icon

#### Test 8.2: Long Content
1. Create task with very long title (255 chars)
2. Create task with very long description
3. **Expected**:
   - Text truncates in list view
   - Full text visible in detail view
   - No layout breaks

#### Test 8.3: Special Characters
1. Create task with emojis: "🎉 Party Task 🎊"
2. Create task with special chars: "Test & Task <>"
3. **Expected**: All characters display correctly

#### Test 8.4: Rapid Actions
1. Quickly toggle task completion multiple times
2. **Expected**: 
   - All actions process
   - Final state is correct
   - No race conditions

### 9. Performance

#### Test 9.1: Load Time
1. Measure app launch time
2. **Expected**: < 3 seconds to interactive

#### Test 9.2: List Scrolling
1. Scroll through long list of tasks
2. **Expected**: 
   - Smooth 60fps scrolling
   - No jank or stuttering

#### Test 9.3: Memory Usage
1. Use app for extended period
2. Create/delete many tasks
3. **Expected**: No memory leaks or crashes

### 10. Platform-Specific

#### Test 10.1: iOS
- [ ] Google Sign-In works
- [ ] Tab bar displays correctly
- [ ] Keyboard behavior correct
- [ ] Safe area insets respected

#### Test 10.2: Android
- [ ] Google Sign-In works
- [ ] Back button navigation works
- [ ] Material design elements
- [ ] Keyboard behavior correct

## 🐛 Common Issues and Solutions

### Issue: "Cannot find module" errors
**Solution**: 
```bash
npm install
npx expo start --clear
```

### Issue: Google Sign-In fails
**Solution**:
- Check `EXPO_PUBLIC_WEB_CLIENT_ID` in `.env`
- Verify OAuth configuration in Google Cloud Console
- Check SHA-1 fingerprint for Android

### Issue: Network request failed
**Solution**:
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Verify backend server is running
- Check device/emulator network connectivity
- For Android emulator, use `10.0.2.2` or actual IP

### Issue: Token refresh fails
**Solution**:
- Check backend `/auth/refresh` endpoint
- Verify refresh token is stored correctly
- Check token expiration times

### Issue: Tasks not loading
**Solution**:
- Check authentication token
- Verify `/tasks` endpoint works
- Check network connectivity
- Look at backend logs

## ✅ Testing Checklist Summary

- [ ] Authentication (login, logout, persistence)
- [ ] Create task
- [ ] Read tasks (list and detail)
- [ ] Update task
- [ ] Delete task
- [ ] Toggle completion
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Pagination
- [ ] Pull to refresh
- [ ] Profile display
- [ ] Navigation (tabs and stack)
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Edge cases
- [ ] Performance
- [ ] iOS testing
- [ ] Android testing

## 📊 Test Results Template

```
Date: __________
Tester: __________
Platform: iOS / Android
Device: __________

| Test | Status | Notes |
|------|--------|-------|
| Authentication | ✅ / ❌ | |
| Create Task | ✅ / ❌ | |
| Read Tasks | ✅ / ❌ | |
| Update Task | ✅ / ❌ | |
| Delete Task | ✅ / ❌ | |
| Search | ✅ / ❌ | |
| Filter | ✅ / ❌ | |
| Pagination | ✅ / ❌ | |
| Profile | ✅ / ❌ | |
| Navigation | ✅ / ❌ | |
| Error Handling | ✅ / ❌ | |
| Performance | ✅ / ❌ | |

Overall Status: ✅ / ❌
```

---

**Note**: This is a comprehensive testing guide. Adjust based on your specific requirements and environment.
