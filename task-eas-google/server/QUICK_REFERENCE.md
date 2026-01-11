# 🚀 Quick Reference - JWT Authentication API

## Server Status
✅ **Running at:** http://localhost:3001
✅ **Database:** PostgreSQL with Prisma ORM
✅ **Auth:** JWT + Google OAuth

---

## 📋 Quick Commands

```bash
# Start server
npm run dev

# Database
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create migration
npx prisma generate            # Generate Prisma client

# View logs
# Server logs appear in terminal
```

---

## 🔑 Environment Variables (.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
ALLOWED_ORIGINS=http://localhost:8081
```

---

## 📡 API Endpoints Cheat Sheet

### 🔓 Public Endpoints

```bash
# Health Check
GET /health

# API Info
GET /

# Login
POST /auth/google
Body: { "idToken": "google_id_token" }
Returns: { user, token, refreshToken, expiresIn }

# Refresh Token
POST /auth/refresh
Body: { "refreshToken": "your_refresh_token" }
Returns: { token, refreshToken, expiresIn }

# Logout
POST /auth/logout
Body: { "refreshToken": "your_refresh_token" }
```

### 🔒 Protected Endpoints (Require Authorization Header)

```bash
# Get Current User
GET /auth/me
Header: Authorization: Bearer <token>

# Verify Token
POST /auth/verify
Header: Authorization: Bearer <token>

# List Tasks
GET /tasks
Header: Authorization: Bearer <token>

# Get Task
GET /tasks/:id
Header: Authorization: Bearer <token>

# Create Task
POST /tasks
Header: Authorization: Bearer <token>
Body: { "title": "Task", "description": "..." }

# Update Task
PATCH /tasks/:id
Header: Authorization: Bearer <token>
Body: { "completed": true }

# Delete Task
DELETE /tasks/:id
Header: Authorization: Bearer <token>
```

---

## 🧪 Quick Test (cURL)

```bash
# 1. Health Check
curl http://localhost:3001/health

# 2. Login (replace with real Google ID token)
curl -X POST http://localhost:3001/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_GOOGLE_ID_TOKEN"}'

# Save the token from response, then:

# 3. Get Current User
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Create Task
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing API"}'

# 5. List Tasks
curl http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Token Flow

```
Login → Get tokens → Use access token → Expires? → Refresh → Repeat
                                                  ↓
                                            Use refresh token
                                                  ↓
                                          Get new tokens
                                                  ↓
                                        Old refresh revoked
```

---

## ⚠️ Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `NO_TOKEN` | No Authorization header | Add `Authorization: Bearer <token>` |
| `TOKEN_EXPIRED` | Access token expired | Use refresh token to get new one |
| `INVALID_TOKEN` | Token is invalid | Login again |
| `NO_REFRESH_TOKEN` | No refresh token provided | Include refresh token in body |
| `REFRESH_FAILED` | Refresh token invalid/expired | Login again |

---

## 📊 Database Models

### User
- id, googleId, email, name, avatar
- lastLogin, createdAt, updatedAt

### RefreshToken
- id, token, userId, expiresAt
- revoked, replacedByToken, createdAt

### Task
- id, title, description, completed
- userId, createdAt, updatedAt

---

## 🛠️ Troubleshooting

**Server won't start?**
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npx prisma generate`

**Authentication fails?**
- Verify GOOGLE_CLIENT_ID matches Google Console
- Check Google ID token is valid
- Ensure JWT_SECRET is set

**Token expired?**
- Access tokens expire in 15 minutes (default)
- Use refresh token to get new ones
- Refresh tokens expire in 7 days (default)

**CORS errors?**
- Add your frontend URL to ALLOWED_ORIGINS
- Restart server after changing .env

---

## 📚 Documentation Files

- `README.md` - Full setup guide
- `TESTING.md` - Testing examples
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `examples/tokenManager.ts` - Client utility
- `examples/ReactNativeExample.tsx` - React Native example

---

## 🎯 Quick Integration Steps

1. **Copy** `examples/tokenManager.ts` to your client
2. **Configure** Google OAuth in Google Cloud Console
3. **Update** environment variables in both server and client
4. **Import** tokenManager in your app
5. **Use** `tokenManager.loginWithGoogle(idToken)`
6. **Make** authenticated calls with `tokenManager.apiCall()`

---

## 💡 Tips

- Access tokens are short-lived (15 min) for security
- Refresh tokens are long-lived (7 days) for UX
- Token rotation prevents replay attacks
- Always use HTTPS in production
- Store tokens securely (SecureStore on mobile)
- Never log tokens in production

---

## 🎉 You're All Set!

Server is running and ready to handle authentication requests!

For detailed information, see the full documentation files.
