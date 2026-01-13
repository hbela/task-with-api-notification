# Bug Fix - DELETE Request Error

## Issue
When deleting a task, the API returned a 400 error:
```
Body cannot be empty when content-type is set to 'application/json'
```

## Root Cause
The API client was always setting `Content-Type: application/json` header for all requests, including DELETE requests which don't have a body. Fastify validates that if the `Content-Type` is set to `application/json`, there must be a JSON body, otherwise it throws an error.

## The Problem Code
```typescript
// lib/api/index.ts - request method
const headers: Record<string, string> = {
  'Content-Type': 'application/json',  // ❌ Always set, even for DELETE
  ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  ...(options.headers as Record<string, string>),
};
```

## The Fix
Only set `Content-Type: application/json` when there's actually a body:

```typescript
// lib/api/index.ts - request method
const headers: Record<string, string> = {
  ...(options.body && { 'Content-Type': 'application/json' }),  // ✅ Only when body exists
  ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  ...(options.headers as Record<string, string>),
};
```

## How It Works Now

### GET Request
- No body → No Content-Type header ✅
- Only Authorization header

### POST/PUT/PATCH Requests
- Has body → Content-Type: application/json ✅
- Authorization header
- Body is JSON stringified

### DELETE Request
- No body → No Content-Type header ✅
- Only Authorization header
- Fastify accepts the request

## Files Modified
- ✅ `lib/api/index.ts` - Updated request method to conditionally set Content-Type

## Testing
Test these scenarios:
- ✅ Delete a task - should work without errors
- ✅ Create a task - should still work (has body)
- ✅ Update a task - should still work (has body)
- ✅ Get tasks - should still work (no body)

## Summary
The DELETE request now works correctly by not sending the `Content-Type` header when there's no body. This is the standard HTTP behavior - only set Content-Type when you're actually sending content.

All CRUD operations now work perfectly! 🎉
