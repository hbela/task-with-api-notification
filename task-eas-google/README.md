# Task Manager with Notifications

A production-ready React Native task management app built with Expo, featuring local notifications, overdue tracking, and a clean, modern UI.

## ✨ Features

### Core Functionality
- ✅ **Full CRUD Operations** - Create, read, update, and delete tasks
- ✅ **Task Priorities** - Low, Medium, High, Urgent
- ✅ **Due Dates & Times** - Set specific deadlines for tasks
- ✅ **Task Descriptions** - Add detailed notes to tasks
- ✅ **Mark Complete** - Toggle tasks between pending and completed

### Smart Notifications
- 🔔 **Local Scheduled Notifications** - Works without internet or Firebase
- ⏰ **Multiple Reminder Times** - Choose from 9 options (5min to 1 week before)
- 🎯 **Smart Scheduling** - Automatically skips overdue tasks and past reminders
- 🌍 **Timezone Support** - Handles timezone changes automatically
- 📅 **Daily Summary** - Optional daily notification at 9 AM
- 🔄 **Automatic Management** - Notifications update when tasks change

### Overdue Task Management
- 🔴 **Visual Indicators** - Red alert icons and borders for overdue tasks
- 📊 **Dynamic Status** - Automatically calculates task status (Pending/Overdue/Done)
- 🎨 **Color Coding** - Green (completed), Red (overdue), Blue (pending)
- ⚠️ **No Wasted Notifications** - Doesn't schedule notifications for overdue tasks

### Advanced Filtering
- 📋 **All** - View all tasks
- ⏳ **Pending** - Upcoming tasks only (default view)
- 🔴 **Overdue** - Tasks needing immediate attention
- ✅ **Done** - Completed tasks

### Polished UI
- 🎨 **Custom Header** - Centered title with clean layout
- 🔙 **Smart Navigation** - Back buttons always return to task list
- 👋 **User Greeting** - Personalized welcome message
- 🎯 **Professional Design** - Modern, clean interface

## 🛠️ Tech Stack

- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **State Management:** TanStack Query (React Query)
- **Backend:** Fastify + PostgreSQL (Prisma ORM)
- **Authentication:** Google OAuth
- **Notifications:** expo-notifications
- **Navigation:** expo-router
- **Icons:** Ionicons

## 📱 Screenshots

[Add screenshots here]

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/task-with-notifications.git
   cd task-with-notifications
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials and Google OAuth keys
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start the server
   npm run dev
   ```

4. **Configure the mobile app**
   ```bash
   # In the root directory, create .env
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3001
   ```

5. **Start the Expo app**
   ```bash
   npm start
   ```

## 📋 Environment Variables

### Backend (.env in /server)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskdb"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3001"
JWT_SECRET="your-jwt-secret"
```

### Mobile App (.env in root)
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP:3001
```

## 🎯 Key Features Explained

### Notification System

The app uses **local scheduled notifications** as the primary notification method:

- **Works Offline** - No internet required
- **Works When App is Closed** - OS handles notifications
- **Survives Device Reboot** - Notifications persist
- **Timezone Aware** - Adjusts to timezone changes
- **Battery Efficient** - Uses native OS notification system

**Optional Push Notifications:**
- Requires Firebase setup (see docs)
- Used as backup for server-initiated alerts
- Not required for core functionality

### Status System

Tasks have three dynamic statuses:
- **Pending** - Future due date or no due date
- **Overdue** - Past due date and not completed
- **Completed** - Marked as done by user

Status is calculated in real-time based on:
- `completed` boolean field
- `dueDate` compared to current time

## 📖 Documentation

- [Notification Implementation](./docs/notification-implementation-summary.md)
- [Notifications Without Firebase](./docs/notifications-without-firebase.md)
- [Notification Troubleshooting](./docs/notification-troubleshooting.md)
- [Timezone Handling](./docs/timezone-handling.md)
- [Overdue Task Implementation](./docs/overdue-task-implementation.md)

## 🏗️ Project Structure

```
task-with-notifications/
├── app/                    # Expo Router pages
│   ├── (app)/             # Authenticated app screens
│   │   ├── index.tsx      # Task list
│   │   ├── create.tsx     # Create task
│   │   ├── profile.tsx    # User profile
│   │   └── task/          # Task detail & edit
│   ├── (auth)/            # Authentication screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── TaskCard.tsx       # Task list item
│   ├── TaskForm.tsx       # Task creation/edit form
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
├── hooks/                 # Custom React hooks
│   ├── useTasksQuery.ts   # Task CRUD with React Query
│   └── useTasks.ts        # Alternative task hook
├── lib/                   # Utilities and services
│   ├── api/               # API clients
│   ├── auth/              # Authentication
│   ├── notifications/     # Notification system
│   │   ├── index.ts       # Main service
│   │   ├── scheduler.ts   # Scheduling logic
│   │   ├── push.ts        # Push notifications
│   │   └── debug.ts       # Debug utilities
│   └── taskUtils.ts       # Task status utilities
├── server/                # Backend API
│   ├── src/               # Fastify server
│   └── prisma/            # Database schema
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

## 🔐 Authentication

The app uses Google OAuth for authentication:
1. User signs in with Google
2. Backend verifies Google token
3. JWT token issued for API access
4. Token stored securely in device

## 🗄️ Database Schema

### User Table
- `id` - Primary key
- `email` - User email (unique)
- `name` - User name
- `expoPushToken` - For push notifications (optional)

### Task Table
- `id` - Primary key
- `title` - Task title
- `description` - Task description (optional)
- `priority` - low | medium | high | urgent
- `completed` - Boolean
- `dueDate` - ISO timestamp (optional)
- `reminderTimes` - Array of minutes before due date
- `userId` - Foreign key to User
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## 🚢 Deployment

### Mobile App
1. Build with EAS Build
2. Submit to Google Play Store / Apple App Store

### Backend
1. Deploy to Railway, Render, or similar
2. Set up PostgreSQL database
3. Configure environment variables

## 🤝 Contributing

This is a template/starter project. Feel free to:
- Fork and customize
- Use as a learning resource
- Build upon for your own projects

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- Built with Expo and React Native
- Notifications powered by expo-notifications
- UI icons from Ionicons
- Backend with Fastify and Prisma

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Made with ❤️ using Expo and React Native**
