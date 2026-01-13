# Quick Start Guide - Production-Ready Task CRUD App

## 🚀 Getting Started

This guide will help you run the newly refactored production-ready task management app.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (`npm install -g expo-cli`)
4. **EAS CLI** (`npm install -g eas-cli`) - for building
5. **Backend server** running
6. **Google Cloud Console** OAuth configured

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
# Navigate to project directory
cd task-eas-google

# Install dependencies
npm install

# Verify critical packages
npm list @react-native-async-storage/async-storage
npm list expo-secure-store
npm list @react-native-google-signin/google-signin
```

### 2. Environment Configuration

Ensure your `.env` file has the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.204:3001

# Google OAuth
EXPO_PUBLIC_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

**Important**: Replace with your actual values!

### 3. Start Backend Server

```bash
# In a separate terminal, navigate to server directory
cd server

# Start the server
npm run dev

# Verify server is running
# Should see: Server running on http://localhost:3001
```

### 4. Start Expo Development Server

```bash
# In the main project directory
npx expo start

# Or with cache clear (if you encounter issues)
npx expo start --clear
```

### 5. Run on Device/Emulator

Choose your platform:

#### iOS Simulator (Mac only)
```bash
# Press 'i' in the Expo terminal
# Or
npx expo start --ios
```

#### Android Emulator
```bash
# Press 'a' in the Expo terminal
# Or
npx expo start --android
```

#### Physical Device
1. Install **Expo Go** app from App Store/Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

## 📱 First Run

### What to Expect

1. **Loading Screen**: Brief loading while checking auth state
2. **Login Screen**: If not logged in, you'll see the login screen
3. **Google Sign-In**: Tap "Continue with Google"
4. **Select Account**: Choose your Google account
5. **App Home**: After successful login, you'll see the Tasks screen

### Creating Your First Task

1. Tap the **"Create"** tab at the bottom
2. Enter a title (required): e.g., "My First Task"
3. Enter a description (optional): e.g., "Testing the new app"
4. Tap **"Create Task"**
5. You'll be redirected to the Tasks list
6. Your new task should appear!

## 🎯 Key Features to Try

### Tasks Screen
- **Search**: Type in the search bar to filter tasks
- **Filter**: Tap "All", "Pending", or "Completed" chips
- **Pull to Refresh**: Pull down to refresh the list
- **Tap a Task**: View full details
- **Toggle Completion**: Tap the checkbox to mark complete/incomplete

### Task Detail
- **Edit**: Tap "Edit Task" button
- **Toggle Status**: Tap "Mark as Complete/Pending"
- **Delete**: Tap "Delete Task" (with confirmation)

### Profile
- View your account information
- See member since date
- Logout option

## 🐛 Troubleshooting

### Issue: App won't start
```bash
# Clear cache and restart
npx expo start --clear

# If still issues, reinstall dependencies
rm -rf node_modules
npm install
npx expo start
```

### Issue: "Cannot connect to backend"
1. Check backend server is running
2. Verify `EXPO_PUBLIC_API_URL` in `.env`
3. For Android emulator, try:
   - `http://10.0.2.2:3001` (Android emulator)
   - `http://192.168.1.XXX:3001` (Your computer's IP)

### Issue: Google Sign-In fails
1. Check `EXPO_PUBLIC_WEB_CLIENT_ID` in `.env`
2. Verify OAuth configuration in Google Cloud Console
3. For Android, ensure SHA-1 fingerprint is added

### Issue: "Module not found" errors
```bash
# Install missing dependencies
npm install @react-native-async-storage/async-storage expo-secure-store

# Restart Expo
npx expo start --clear
```

### Issue: TypeScript errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# If errors persist, restart TypeScript server in your IDE
```

## 📂 Project Structure Overview

```
task-eas-google/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login screen
│   ├── (app)/             # Main app (protected)
│   │   ├── index.tsx      # Tasks list
│   │   ├── create.tsx     # Create task
│   │   ├── profile.tsx    # User profile
│   │   └── task/          # Task detail & edit
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── lib/                   # Core functionality
│   ├── api/              # API client & methods
│   └── auth/             # Authentication
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── server/               # Backend (separate)
```

## 🔄 Development Workflow

### Making Changes

1. **Edit Code**: Make your changes in the appropriate files
2. **Auto Reload**: Expo will automatically reload the app
3. **Check Console**: Watch for errors in the terminal
4. **Test**: Verify your changes work as expected

### Debugging

```bash
# Open React DevTools
# Press 'j' in Expo terminal

# View logs
# Logs appear in the terminal where you ran 'expo start'

# For more detailed logs
npx expo start --dev-client
```

## 🏗️ Building for Production

### Development Build
```bash
# Create development build
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Build
```bash
# Create production build
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Install on Device
```bash
# After build completes, download and install the APK/IPA
# Or submit to app stores
eas submit --platform android
eas submit --platform ios
```

## 📚 Additional Resources

### Documentation
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### API Endpoints
- `POST /auth/google` - Google Sign-In
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create task
- `GET /tasks/:id` - Get task by ID
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Dependencies installed successfully
- [ ] `.env` file configured correctly
- [ ] Backend server running
- [ ] Expo dev server starts without errors
- [ ] App loads on device/emulator
- [ ] Google Sign-In works
- [ ] Can create a task
- [ ] Can view tasks list
- [ ] Can edit a task
- [ ] Can delete a task
- [ ] Navigation works smoothly

## 🎉 You're Ready!

If all the above works, you're ready to start using and developing the production-ready task management app!

### Next Steps
1. Review the code structure
2. Read the implementation summary: `docs/REFACTORING_COMPLETE.md`
3. Follow the testing guide: `docs/TESTING_GUIDE.md`
4. Start building new features!

## 💡 Tips

- **Hot Reload**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu
- **Logs**: Check terminal for console.log output
- **Network**: Use React Native Debugger for network inspection
- **State**: Use React DevTools to inspect component state

---

**Need Help?** Check the troubleshooting section or review the implementation docs.

**Happy Coding!** 🚀
