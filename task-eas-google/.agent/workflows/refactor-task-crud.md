---
description: Refactor to Production-Ready Task CRUD App
---

# Production-Ready Task Management CRUD Application Refactoring

This workflow implements a complete refactoring of the current mobile app into a production-ready task management application following the guide in `docs/Task-crud-complete-implementation.md`.

## Phase 1: Project Structure Setup

### 1.1 Create New Directory Structure
```bash
# Create auth group
mkdir -p app/(auth)
mkdir -p app/(app)/task/edit

# Create lib structure
mkdir -p lib/auth
mkdir -p lib/api
mkdir -p lib/constants
mkdir -p lib/utils

# Create types directory
mkdir -p types

# Create hooks directory (already exists, verify)
# hooks/

# Create components directory (already exists, verify)
# components/
```

### 1.2 Install Required Dependencies
```bash
npm install @react-native-async-storage/async-storage expo-secure-store
```

## Phase 2: Type Definitions

### 2.1 Create Type Files
- `types/user.ts` - User interface definitions
- `types/task.ts` - Task interface definitions  
- `types/api.ts` - API response types

## Phase 3: Core Infrastructure

### 3.1 API Client Setup
- `lib/api/index.ts` - Core API client with token refresh logic
- `lib/api/auth.ts` - Authentication API methods
- `lib/api/tasks.ts` - Task CRUD API methods

### 3.2 Authentication Context
- `lib/auth/index.tsx` - Auth context provider
- `lib/auth/useAuth.ts` - Auth hook (or export from index)

### 3.3 Custom Hooks
- `hooks/useTasks.ts` - Task management hook with CRUD operations

## Phase 4: Routing & Navigation

### 4.1 Root Layout
- Update `app/_layout.tsx` - Add auth state management and routing logic

### 4.2 Auth Group
- `app/(auth)/_layout.tsx` - Auth group layout
- `app/(auth)/login.tsx` - Login screen with Google Sign-In

### 4.3 App Group (Protected Routes)
- `app/(app)/_layout.tsx` - Tab navigation layout
- `app/(app)/index.tsx` - Tasks list screen
- `app/(app)/create.tsx` - Create task screen
- `app/(app)/profile.tsx` - User profile screen
- `app/(app)/task/[id].tsx` - Task detail screen
- `app/(app)/task/edit/[id].tsx` - Edit task screen

### 4.4 Additional Routes
- `app/index.tsx` - Initial redirect handler
- `app/+not-found.tsx` - 404 page

## Phase 5: Components

### 5.1 Task Components
- `components/TaskCard.tsx` - Individual task card
- `components/TaskForm.tsx` - Reusable task form
- `components/TaskList.tsx` - Task list component (optional)

### 5.2 UI Components
- `components/LoadingSpinner.tsx` - Loading indicator
- `components/ErrorMessage.tsx` - Error display component

## Phase 6: Backend Updates (if needed)

### 6.1 Verify Server Endpoints
- Check `/auth/google` endpoint
- Check `/auth/refresh` endpoint
- Check `/auth/logout` endpoint
- Check `/auth/me` endpoint
- Check `/tasks` CRUD endpoints
- Verify pagination support

### 6.2 Update Server Response Formats
- Ensure consistent response structure
- Add pagination metadata
- Verify error response format

## Phase 7: Testing & Validation

### 7.1 Test Authentication Flow
- Google Sign-In
- Token refresh
- Auto-login on app restart
- Logout

### 7.2 Test Task CRUD Operations
- Create task
- Read tasks (list & detail)
- Update task
- Delete task
- Toggle completion status

### 7.3 Test Navigation
- Tab navigation
- Stack navigation
- Deep linking
- Back navigation

### 7.4 Test Edge Cases
- Network errors
- Token expiration
- Invalid data
- Empty states
- Loading states

## Phase 8: Polish & Optimization

### 8.1 UI/UX Improvements
- Add animations
- Improve loading states
- Better error messages
- Accessibility features

### 8.2 Performance Optimization
- Implement proper memoization
- Optimize re-renders
- Add debouncing for search
- Implement virtual lists for large datasets

### 8.3 Code Quality
- Add proper TypeScript types
- Remove console.logs
- Add comments for complex logic
- Follow consistent naming conventions

## Implementation Order

1. **Types** → Define all interfaces first
2. **API Client** → Build the foundation for API calls
3. **Auth Context** → Set up authentication state management
4. **Routing** → Implement navigation structure
5. **Hooks** → Create data management hooks
6. **Components** → Build reusable UI components
7. **Screens** → Implement all screens
8. **Testing** → Validate all functionality
9. **Polish** → Final improvements

## Key Considerations

- **Backward Compatibility**: Ensure existing functionality continues to work
- **Data Migration**: Handle existing user data properly
- **Environment Variables**: Verify all required env vars are set
- **Error Handling**: Implement comprehensive error handling
- **Security**: Ensure tokens are stored securely
- **Performance**: Optimize for mobile performance
- **User Experience**: Smooth transitions and feedback

## Success Criteria

✅ User can sign in with Google
✅ User stays logged in after app restart
✅ User can create tasks
✅ User can view task list with search/filter
✅ User can view task details
✅ User can edit tasks
✅ User can delete tasks
✅ User can toggle task completion
✅ Pagination works correctly
✅ Token refresh works automatically
✅ User can log out
✅ All navigation flows work smoothly
✅ Error states are handled gracefully
✅ Loading states provide feedback
✅ App works offline (with proper error messages)
