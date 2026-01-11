# JWT Authentication Server with Prisma

Complete authentication system with JWT token refresh, middleware, and security practices.

## Features

- ✅ **Google OAuth Authentication** - Sign in with Google
- ✅ **JWT Access Tokens** - Short-lived (15 minutes) for API access
- ✅ **Refresh Token Rotation** - Long-lived (7 days) with automatic rotation
- ✅ **Protected Routes** - Middleware-based authentication
- ✅ **Task Management** - CRUD operations demonstrating protected resources
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **Security Best Practices** - Token rotation, HTTP-only cookies, CORS

## Tech Stack

- **Fastify** - Fast web framework
- **Prisma** - Modern ORM for PostgreSQL
- **@fastify/jwt** - JWT authentication
- **@fastify/cookie** - Cookie management
- **Google Auth Library** - Google OAuth verification

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
# Database - Update with your PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/taskeasdb?schema=public

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com

# JWT Secret - Generate a secure random string (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars

# Server Configuration
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# CORS - Add your frontend URLs
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.1:8081
```

### 3. Setup Database

Make sure PostgreSQL is running, then run migrations:

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Or if database already exists, push schema
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`

## API Endpoints

### Authentication

#### POST `/auth/google`
Authenticate with Google ID token

**Request:**
```json
{
  "idToken": "google_id_token_here",
  "deviceInfo": {
    "platform": "ios",
    "version": "14.0"
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
    "avatar": "https://..."
  },
  "token": "jwt_access_token",
  "refreshToken": "refresh_token",
  "expiresIn": 900
}
```

#### POST `/auth/refresh`
Refresh access token

**Request:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:**
```json
{
  "token": "new_jwt_access_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 900
}
```

#### POST `/auth/logout`
Logout and revoke refresh token

**Request:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

#### GET `/auth/me` 🔒
Get current user profile (requires authentication)

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "lastLogin": "2026-01-10T16:30:00Z",
    "createdAt": "2026-01-01T10:00:00Z"
  }
}
```

### Tasks (Protected Routes)

All task endpoints require authentication via `Authorization: Bearer <token>` header.

#### GET `/tasks` 🔒
Get all tasks for authenticated user

#### GET `/tasks/:id` 🔒
Get a specific task

#### POST `/tasks` 🔒
Create a new task

**Request:**
```json
{
  "title": "Complete project",
  "description": "Finish the authentication system",
  "completed": false
}
```

#### PATCH `/tasks/:id` 🔒
Update a task

**Request:**
```json
{
  "title": "Updated title",
  "completed": true
}
```

#### DELETE `/tasks/:id` 🔒
Delete a task

## Database Schema

### User
- `id` - Auto-increment primary key
- `googleId` - Unique Google user ID
- `email` - Unique email address
- `name` - User's display name
- `avatar` - Profile picture URL
- `lastLogin` - Last login timestamp
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### RefreshToken
- `id` - Auto-increment primary key
- `token` - Unique refresh token
- `userId` - Foreign key to User
- `expiresAt` - Token expiration timestamp
- `revoked` - Whether token has been revoked
- `replacedByToken` - Token that replaced this one (for rotation)
- `createdAt` - Token creation timestamp

### Task
- `id` - Auto-increment primary key
- `title` - Task title
- `description` - Task description
- `completed` - Completion status
- `userId` - Foreign key to User
- `createdAt` - Task creation timestamp
- `updatedAt` - Last update timestamp

## Security Features

### Token Management
- **Short-lived Access Tokens**: 15 minutes expiry
- **Long-lived Refresh Tokens**: 7 days expiry
- **Automatic Token Rotation**: New refresh token on each refresh
- **Token Revocation**: Logout revokes all related tokens

### Authentication Flow
1. User signs in with Google
2. Server verifies Google ID token
3. Server generates JWT access token + refresh token
4. Client stores both tokens securely
5. Client uses access token for API requests
6. When access token expires, client uses refresh token to get new tokens
7. Old refresh token is revoked (rotation)

### Middleware
- **authenticate**: Verifies JWT and attaches user to request
- **optionalAuthenticate**: Verifies JWT if present, doesn't fail if missing

### CORS
- Configurable allowed origins
- Credentials support for cookies
- Automatic origin validation

## Development

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Push schema without migration
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Project Structure

```
server/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   └── tasks.ts           # Task CRUD routes
│   ├── services/
│   │   └── authService.ts     # Auth business logic
│   ├── types/
│   │   └── fastify.d.ts       # TypeScript type extensions
│   └── index.ts               # Main server file
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── package.json
└── tsconfig.json
```

## Testing with cURL

### Login with Google
```bash
curl -X POST http://localhost:3001/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
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
  -d '{"title": "My Task", "description": "Task description"}'
```

### Get All Tasks
```bash
curl http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (32+ characters)
3. Configure proper `DATABASE_URL`
4. Set specific `ALLOWED_ORIGINS` (no wildcards)
5. Enable HTTPS
6. Use environment-specific secrets
7. Set up database backups
8. Monitor token cleanup (expired/revoked tokens)

## License

MIT
