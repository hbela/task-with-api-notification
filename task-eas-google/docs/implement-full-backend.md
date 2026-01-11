## 🔐 **Deep Dive: JWT Authentication Flow & Token Management**

Let me explain the complete authentication system with proper token refresh, middleware, and security practices.

## 📁 **Project Structure**
```
backend/
├── server.js          # Main server file
├── middleware/        # Auth middleware
│   └── auth.js
├── routes/           # API routes
│   ├── auth.js
│   ├── tasks.js
│   └── users.js
├── services/         # Business logic
│   └── authService.js
└── package.json
```

## 🔄 **Complete Token Flow Diagram**
```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Sign in with Google                                      │
│ 2. Get Google ID Token → Send to /api/auth/google           │
│ 3. Receive: {user, token, refreshToken}                     │
│ 4. Store tokens securely                                    │
│ 5. Use token for API calls (auto-refresh when expired)      │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Fastify Backend                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Verify Google ID Token                                   │
│ 2. Find/Create user in DB                                   │
│ 3. Generate JWT (short-lived) & Refresh Token (long-lived)  │
│ 4. Return both tokens                                       │
│ 5. Validate JWT on protected routes                         │
│ 6. Refresh tokens when JWT expires                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                     PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────┤
│ Users: id, googleId, email, name, tokens                    │
│ RefreshTokens: id, userId, token, expiresAt, revoked        │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ **1. Enhanced Database Schema**

```sql
-- Enhanced User table with refresh token support
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    googleId VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar TEXT,
    lastLogin TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store refresh tokens securely
CREATE TABLE RefreshToken (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    expiresAt TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    replacedByToken TEXT, -- For token rotation
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task table (unchanged)
CREATE TABLE Task (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    userId INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_refresh_token_user ON RefreshToken(userId);
CREATE INDEX idx_refresh_token_expires ON RefreshToken(expiresAt);
CREATE INDEX idx_task_user ON Task(userId);
```

## 🏗️ **2. Complete Auth Service Layer**

```javascript
// services/authService.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

class AuthService {
    constructor(db) {
        this.db = db;
        this.googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);
    }

    // Verify Google token and get user data
    async verifyGoogleToken(idToken) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_WEB_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Additional security checks
        if (!payload.email_verified) {
            throw new Error('Email not verified by Google');
        }
        
        if (payload.iss !== 'accounts.google.com' && 
            payload.iss !== 'https://accounts.google.com') {
            throw new Error('Invalid token issuer');
        }
        
        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatar: payload.picture,
            locale: payload.locale,
            hd: payload.hd // Google Workspace domain
        };
    }

    // Find or create user with transaction
    async findOrCreateUser(googleUserData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check existing user
            const existingUser = await client.query(
                `SELECT id, email, name, avatar, lastLogin 
                 FROM "User" 
                 WHERE googleId = $1 OR email = $2 
                 FOR UPDATE`, // Lock row for update
                [googleUserData.googleId, googleUserData.email]
            );
            
            let user;
            
            if (existingUser.rows.length > 0) {
                // Update existing user
                user = existingUser.rows[0];
                await client.query(
                    `UPDATE "User" 
                     SET name = $1, avatar = $2, lastLogin = CURRENT_TIMESTAMP 
                     WHERE id = $3`,
                    [googleUserData.name, googleUserData.avatar, user.id]
                );
            } else {
                // Create new user
                const newUser = await client.query(
                    `INSERT INTO "User" (googleId, email, name, avatar) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING id, email, name, avatar, lastLogin`,
                    [googleUserData.googleId, googleUserData.email, 
                     googleUserData.name, googleUserData.avatar]
                );
                user = newUser.rows[0];
            }
            
            await client.query('COMMIT');
            return user;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Generate JWT token
    generateJWT(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            type: 'access'
        };
        
        // Short-lived access token (15 minutes)
        return fastify.jwt.sign(payload, {
            expiresIn: '15m'
        });
    }

    // Generate and store refresh token
    async generateRefreshToken(userId) {
        // Generate secure random token
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
        
        // Store in database
        await this.db.query(
            `INSERT INTO RefreshToken (token, userId, expiresAt) 
             VALUES ($1, $2, $3)`,
            [refreshToken, userId, expiresAt]
        );
        
        return {
            token: refreshToken,
            expiresAt
        };
    }

    // Verify refresh token
    async verifyRefreshToken(token) {
        const result = await this.db.query(
            `SELECT rt.*, u.id as userId, u.email 
             FROM RefreshToken rt
             JOIN "User" u ON rt.userId = u.id
             WHERE rt.token = $1 
             AND rt.expiresAt > CURRENT_TIMESTAMP 
             AND rt.revoked = false`,
            [token]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Invalid or expired refresh token');
        }
        
        return result.rows[0];
    }

    // Revoke refresh token (for logout)
    async revokeRefreshToken(token, replacedByToken = null) {
        await this.db.query(
            `UPDATE RefreshToken 
             SET revoked = true, replacedByToken = $2 
             WHERE token = $1 OR replacedByToken = $1`,
            [token, replacedByToken]
        );
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        // Verify refresh token
        const tokenData = await this.verifyRefreshToken(refreshToken);
        
        // Revoke old token (token rotation)
        await this.revokeRefreshToken(refreshToken);
        
        // Generate new tokens
        const accessToken = this.generateJWT({
            id: tokenData.userid,
            email: tokenData.email
        });
        
        const newRefreshToken = await this.generateRefreshToken(tokenData.userid);
        
        return {
            accessToken,
            refreshToken: newRefreshToken.token,
            user: {
                id: tokenData.userid,
                email: tokenData.email
            }
        };
    }
}

module.exports = AuthService;
```

## 🛡️ **3. Complete Auth Middleware**

```javascript
// middleware/auth.js
const fp = require('fastify-plugin');

async function authMiddleware(fastify, options) {
    
    // Authentication hook
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            // 1. Get token from header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('No token provided');
            }
            
            const token = authHeader.substring(7);
            
            // 2. Verify JWT
            const decoded = await request.jwtVerify(token);
            
            // 3. Additional checks
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            
            // 4. Attach user to request
            request.user = {
                id: decoded.sub,
                email: decoded.email
            };
            
            // 5. Optional: Check if user exists in DB (for extra security)
            const userExists = await fastify.db.query(
                'SELECT id FROM "User" WHERE id = $1',
                [decoded.sub]
            );
            
            if (userExists.rows.length === 0) {
                throw new Error('User no longer exists');
            }
            
        } catch (err) {
            // Handle specific JWT errors
            if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
                reply.code(401).send({ 
                    error: 'No authorization header',
                    code: 'NO_TOKEN'
                });
            } else if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
                reply.code(401).send({ 
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED',
                    message: 'Please refresh your token'
                });
            } else {
                reply.code(401).send({ 
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
        }
    });
    
    // Optional: Role-based access control
    fastify.decorate('authorize', function(roles = []) {
        return async function(request, reply) {
            if (!request.user) {
                reply.code(401).send({ error: 'Not authenticated' });
                return;
            }
            
            // In a real app, check user roles from database
            const userRoles = await getUserRoles(request.user.id);
            const hasRole = roles.some(role => userRoles.includes(role));
            
            if (!hasRole) {
                reply.code(403).send({ error: 'Insufficient permissions' });
            }
        };
    });
}

module.exports = fp(authMiddleware);
```

## 🔄 **4. Complete Auth Routes**

```javascript
// routes/auth.js
async function authRoutes(fastify, options) {
    const authService = new (require('../services/authService'))(fastify.db);
    
    // Google Sign-In
    fastify.post('/auth/google', {
        schema: {
            body: {
                type: 'object',
                required: ['idToken'],
                properties: {
                    idToken: { type: 'string' },
                    deviceInfo: { type: 'object' } // Optional: for tracking devices
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { idToken, deviceInfo } = request.body;
            
            // 1. Verify Google token
            const googleUser = await authService.verifyGoogleToken(idToken);
            
            // 2. Find or create user
            const user = await authService.findOrCreateUser(googleUser);
            
            // 3. Generate tokens
            const accessToken = authService.generateJWT(user);
            const refreshToken = await authService.generateRefreshToken(user.id);
            
            // 4. Optional: Track login device
            if (deviceInfo) {
                await trackDeviceLogin(user.id, deviceInfo);
            }
            
            // 5. Set HTTP-only cookie for web (optional)
            reply.setCookie('refreshToken', refreshToken.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 // 7 days
            });
            
            // 6. Return response
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar
                },
                token: accessToken,
                refreshToken: refreshToken.token, // For mobile apps
                expiresIn: 15 * 60 // 15 minutes in seconds
            };
            
        } catch (error) {
            fastify.log.error('Google auth error:', error);
            reply.code(401).send({ 
                error: 'Authentication failed',
                details: error.message 
            });
        }
    });
    
    // Refresh token endpoint
    fastify.post('/auth/refresh', async (request, reply) => {
        try {
            const { refreshToken } = request.body;
            
            if (!refreshToken) {
                // Check cookies for web
                const cookieToken = request.cookies.refreshToken;
                if (!cookieToken) {
                    throw new Error('No refresh token provided');
                }
                refreshToken = cookieToken;
            }
            
            const tokens = await authService.refreshAccessToken(refreshToken);
            
            // Update cookie
            reply.setCookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60
            });
            
            return {
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: 15 * 60
            };
            
        } catch (error) {
            reply.code(401).send({ error: 'Token refresh failed' });
        }
    });
    
    // Logout endpoint
    fastify.post('/auth/logout', async (request, reply) => {
        try {
            const { refreshToken } = request.body;
            const cookieToken = request.cookies.refreshToken;
            
            const tokenToRevoke = refreshToken || cookieToken;
            
            if (tokenToRevoke) {
                await authService.revokeRefreshToken(tokenToRevoke);
            }
            
            // Clear cookie
            reply.clearCookie('refreshToken');
            
            return { message: 'Logged out successfully' };
            
        } catch (error) {
            fastify.log.error('Logout error:', error);
            reply.code(400).send({ error: 'Logout failed' });
        }
    });
    
    // Protected test endpoint
    fastify.get('/auth/me', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        // User is already attached to request by authenticate hook
        const userDetails = await fastify.db.query(
            `SELECT id, email, name, avatar, lastLogin 
             FROM "User" 
             WHERE id = $1`,
            [request.user.id]
        );
        
        return { user: userDetails.rows[0] };
    });
}

module.exports = authRoutes;
```

## 📱 **5. Enhanced React Native Token Manager**

```javascript
// utils/tokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

class TokenManager {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.refreshPromise = null; // Prevent multiple refresh calls
    }
    
    // Platform-specific secure storage
    async secureSetItem(key, value) {
        if (Platform.OS === 'web') {
            return AsyncStorage.setItem(key, value);
        } else {
            return SecureStore.setItemAsync(key, value);
        }
    }
    
    async secureGetItem(key) {
        if (Platform.OS === 'web') {
            return AsyncStorage.getItem(key);
        } else {
            return SecureStore.getItemAsync(key);
        }
    }
    
    async secureRemoveItem(key) {
        if (Platform.OS === 'web') {
            return AsyncStorage.removeItem(key);
        } else {
            return SecureStore.deleteItemAsync(key);
        }
    }
    
    // Store tokens
    async storeTokens(accessToken, refreshToken, user) {
        await this.secureSetItem('accessToken', accessToken);
        await this.secureSetItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());
    }
    
    // Clear tokens (logout)
    async clearTokens() {
        await this.secureRemoveItem('accessToken');
        await this.secureRemoveItem('refreshToken');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('tokenTimestamp');
    }
    
    // Get current access token (with auto-refresh)
    async getAccessToken() {
        let accessToken = await this.secureGetItem('accessToken');
        const tokenTimestamp = await AsyncStorage.getItem('tokenTimestamp');
        
        // Check if token is expired (assuming 15 minute expiry)
        if (accessToken && tokenTimestamp) {
            const tokenAge = Date.now() - parseInt(tokenTimestamp);
            const tokenMaxAge = 14 * 60 * 1000; // Refresh at 14 minutes
            // 14 * 60 * 1000
            
            if (tokenAge > tokenMaxAge) {
                // Token is old, try to refresh
                accessToken = await this.refreshAccessToken();
            }
        }
        
        return accessToken;
    }
    
    // Refresh access token
    async refreshAccessToken() {
        // Prevent multiple simultaneous refresh calls
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        
        this.refreshPromise = (async () => {
            try {
                const refreshToken = await this.secureGetItem('refreshToken');
                
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken })
                });
                
                if (!response.ok) {
                    // Refresh token is invalid, logout user
                    await this.clearTokens();
                    throw new Error('Session expired. Please login again.');
                }
                
                const data = await response.json();
                
                // Store new tokens
                await this.secureSetItem('accessToken', data.token);
                await this.secureSetItem('refreshToken', data.refreshToken);
                await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());
                
                return data.token;
                
            } catch (error) {
                // Clear tokens on refresh failure
                await this.clearTokens();
                throw error;
            } finally {
                this.refreshPromise = null;
            }
        })();
        
        return this.refreshPromise;
    }
    
    // Make authenticated API call
    async apiCall(url, options = {}) {
        const accessToken = await this.getAccessToken();
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        };
        
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        let response = await fetch(`${this.apiBaseUrl}${url}`, config);
        
        // If token expired, refresh and retry once
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            
            if (errorData.code === 'TOKEN_EXPIRED') {
                const newToken = await this.refreshAccessToken();
                config.headers.Authorization = `Bearer ${newToken}`;
                response = await fetch(`${this.apiBaseUrl}${url}`, config);
            }
        }
        
        return response;
    }
    
    // Get user info
    async getUser() {
        const userString = await AsyncStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    }
    
    // Check if user is logged in
    async isLoggedIn() {
        const accessToken = await this.secureGetItem('accessToken');
        const user = await this.getUser();
        return !!(accessToken && user);
    }
}

export default TokenManager;
```

## 📱 **6. Updated React Native Sign-In**

```javascript
// App.js or AuthScreen.js
import React, { useState, useEffect } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import TokenManager from './utils/tokenManager';

// Initialize token manager
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const tokenManager = new TokenManager(API_BASE_URL);

const AuthScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // Check existing login on mount
        checkExistingLogin();
        
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
            offlineAccess: true,
            forceCodeForRefreshToken: true
        });
    }, []);
    
    const checkExistingLogin = async () => {
        const isLoggedIn = await tokenManager.isLoggedIn();
        if (isLoggedIn) {
            const userData = await tokenManager.getUser();
            setUser(userData);
            navigation.navigate('Main');
        }
    };
    
    const handleGoogleSignIn = async () => {
        setLoading(true);
        
        try {
            // 1. Check Google Play Services (Android)
            await GoogleSignin.hasPlayServices();
            
            // 2. Sign in with Google
            const userInfo = await GoogleSignin.signIn();
            const { idToken } = userInfo;
            
            // 3. Send to backend
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken,
                    deviceInfo: {
                        platform: Platform.OS,
                        version: Platform.Version
                    }
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 4. Store tokens
                await tokenManager.storeTokens(
                    data.token,
                    data.refreshToken,
                    data.user
                );
                
                // 5. Update state and navigate
                setUser(data.user);
                navigation.navigate('Main');
            } else {
                alert(`Login failed: ${data.error}`);
            }
            
        } catch (error) {
            console.error('Sign-in error:', error);
            
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                alert('Login cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                alert('Login already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                alert('Play services not available');
            } else {
                alert(`Login error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = async () => {
        try {
            // 1. Revoke Google token (optional)
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            
            // 2. Call backend logout
            const refreshToken = await tokenManager.secureGetItem('refreshToken');
            if (refreshToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken })
                });
            }
            
            // 3. Clear local tokens
            await tokenManager.clearTokens();
            
            // 4. Update state
            setUser(null);
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : user ? (
                <View>
                    <Text>Welcome {user.name}!</Text>
                    <Button title="Logout" onPress={handleLogout} />
                </View>
            ) : (
                <Button
                    title="Sign in with Google"
                    onPress={handleGoogleSignIn}
                />
            )}
        </View>
    );
};

export default AuthScreen;
```

## 📝 **7. Usage Example: Creating a Task**

```javascript
// TaskScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import tokenManager from '../utils/tokenManager';

const TaskScreen = () => {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    useEffect(() => {
        loadTasks();
    }, []);
    
    const loadTasks = async () => {
        try {
            const response = await tokenManager.apiCall('/tasks');
            const data = await response.json();
            setTasks(data.tasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };
    
    const createTask = async () => {
        if (!title.trim()) return;
        
        try {
            const response = await tokenManager.apiCall('/tasks', {
                method: 'POST',
                body: JSON.stringify({ title, description })
            });
            
            const data = await response.json();
            
            // Add new task to list
            setTasks([data.task, ...tasks]);
            
            // Clear form
            setTitle('');
            setDescription('');
            
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };
    
    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Task title"
                value={title}
                onChangeText={setTitle}
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <TextInput
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <Button title="Add Task" onPress={createTask} />
            
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, borderBottomWidth: 1 }}>
                        <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
                        <Text>{item.description}</Text>
                        <Text>{item.completed ? 'Completed' : 'Pending'}</Text>
                    </View>
                )}
            />
        </View>
    );
};
```

## 🔧 **8. Environment Configuration**

```env
# Backend .env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb

# Google OAuth
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_SECRET=your_google_secret

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGIN=http://localhost:19006,https://yourapp.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

## ✅ **Security Checklist**

| Security Measure | Implementation | Purpose |
|-----------------|---------------|---------|
| **HTTPS** | Use in production | Encrypts all traffic |
| **JWT Expiry** | Short-lived (15min) | Limits token exposure |
| **Refresh Token Rotation** | New token on each refresh | Prevents token reuse |
| **HTTP-only Cookies** | For web clients | Prevents XSS access |
| **CORS Configuration** | Specific origins only | Prevents CSRF |
| **Input Validation** | Fastify schemas | Prevents injection |
| **Database Pooling** | Connection limits | Prevents DoS |
| **Error Logging** | No sensitive data | Security monitoring |
| **Token Blacklisting** | For logout/compromise | Immediate revocation |

This complete system provides:
1. **Secure authentication** with Google OAuth
2. **Automatic user creation** in your database
3. **JWT-based sessions** with auto-refresh
4. **Protected API endpoints**
5. **Proper error handling** and security measures

The token manager handles all token storage, refresh logic, and authenticated API calls automatically, making it easy to use throughout your React Native app.