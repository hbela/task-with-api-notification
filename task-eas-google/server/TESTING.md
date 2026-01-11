# API Testing Guide

This guide shows how to test the JWT authentication system using various tools.

## Prerequisites

- Server running at `http://localhost:3001`
- Google OAuth credentials configured
- PostgreSQL database running

## Testing with Postman/Insomnia

### 1. Health Check

**GET** `http://localhost:3001/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T16:43:21.000Z",
  "uptime": 123.456
}
```

### 2. Get API Documentation

**GET** `http://localhost:3001/`

**Response:**
```json
{
  "name": "Task EAS Google API",
  "version": "1.0.0",
  "description": "JWT Authentication with Google OAuth and Task Management",
  "endpoints": { ... }
}
```

### 3. Google OAuth Login

To get a Google ID token for testing:

1. Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Select "Google OAuth2 API v2"
3. Check "https://www.googleapis.com/auth/userinfo.email"
4. Click "Authorize APIs"
5. Exchange authorization code for tokens
6. Copy the `id_token`

**POST** `http://localhost:3001/auth/google`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE",
  "deviceInfo": {
    "platform": "web",
    "version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "expiresIn": 900
}
```

**Save the `token` and `refreshToken` for subsequent requests!**

### 4. Get Current User (Protected)

**GET** `http://localhost:3001/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "lastLogin": "2026-01-10T16:43:21.000Z",
    "createdAt": "2026-01-10T16:43:21.000Z"
  }
}
```

### 5. Create a Task (Protected)

**POST** `http://localhost:3001/tasks`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Complete authentication system",
  "description": "Implement JWT with refresh tokens",
  "completed": false
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Complete authentication system",
    "description": "Implement JWT with refresh tokens",
    "completed": false,
    "userId": 1,
    "createdAt": "2026-01-10T16:45:00.000Z",
    "updatedAt": "2026-01-10T16:45:00.000Z"
  }
}
```

### 6. Get All Tasks (Protected)

**GET** `http://localhost:3001/tasks`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Complete authentication system",
      "description": "Implement JWT with refresh tokens",
      "completed": false,
      "userId": 1,
      "createdAt": "2026-01-10T16:45:00.000Z",
      "updatedAt": "2026-01-10T16:45:00.000Z"
    }
  ]
}
```

### 7. Update a Task (Protected)

**PATCH** `http://localhost:3001/tasks/1`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Complete authentication system",
    "description": "Implement JWT with refresh tokens",
    "completed": true,
    "userId": 1,
    "createdAt": "2026-01-10T16:45:00.000Z",
    "updatedAt": "2026-01-10T16:46:00.000Z"
  }
}
```

### 8. Refresh Access Token

When your access token expires (after 15 minutes), use the refresh token:

**POST** `http://localhost:3001/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Response:**
```json
{
  "token": "NEW_JWT_ACCESS_TOKEN",
  "refreshToken": "NEW_REFRESH_TOKEN",
  "expiresIn": 900
}
```

**Note:** The old refresh token is now revoked (token rotation). Use the new tokens!

### 9. Logout

**POST** `http://localhost:3001/auth/logout`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3001/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN"
  }'
```

### Get Current User
```bash
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Task
```bash
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Task",
    "description": "Task description"
  }'
```

### Get All Tasks
```bash
curl http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Task
```bash
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

### Delete Task
```bash
curl -X DELETE http://localhost:3001/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Error Responses

### 401 Unauthorized - No Token
```json
{
  "error": "No authorization header",
  "code": "NO_TOKEN"
}
```

### 401 Unauthorized - Token Expired
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED",
  "message": "Please refresh your token"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

### 404 Not Found - Task
```json
{
  "error": "Task not found"
}
```

### 400 Bad Request - Validation Error
```json
{
  "error": "Validation failed",
  "details": "..."
}
```

## Testing Token Expiry

1. Login and get tokens
2. Wait 15 minutes (or modify `JWT_ACCESS_EXPIRY` in `.env` to `1m` for faster testing)
3. Try to access a protected route
4. You should get a `TOKEN_EXPIRED` error
5. Use the refresh token to get new tokens
6. Access the protected route again with the new token

## Testing Token Rotation

1. Login and save the refresh token
2. Use the refresh token to get new tokens
3. Try to use the old refresh token again
4. You should get an error because it's been revoked

## Database Inspection

Use Prisma Studio to inspect the database:

```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can:
- View all users
- View all refresh tokens
- View all tasks
- See token expiry times
- Check revoked tokens

## Common Issues

### "Authentication failed" on Google Login
- Check that `GOOGLE_CLIENT_ID` in `.env` matches your Google OAuth credentials
- Verify the Google ID token is valid and not expired
- Ensure the token audience matches your client ID

### "User no longer exists" 
- The user was deleted from the database
- Clear tokens and login again

### "Token expired"
- Use the refresh token to get new tokens
- If refresh token also expired, login again

### CORS Errors (from browser)
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Example: `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081`
