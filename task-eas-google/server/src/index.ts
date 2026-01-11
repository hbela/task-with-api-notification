import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth';
import { taskRoutes } from './routes/tasks';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
  },
});

// Register plugins
async function registerPlugins() {
  // Register CORS
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Register cookie plugin
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET, // for signed cookies
    parseOptions: {},
  });

  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    },
  });
}

// Register routes
async function registerRoutes() {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return {
      name: 'Task EAS Google API',
      version: '1.0.0',
      description: 'JWT Authentication with Google OAuth and Task Management',
      endpoints: {
        health: 'GET /health',
        auth: {
          google: 'POST /auth/google - Authenticate with Google',
          refresh: 'POST /auth/refresh - Refresh access token',
          verify: 'POST /auth/verify - Verify token validity',
          me: 'GET /auth/me - Get current user (protected)',
          logout: 'POST /auth/logout - Logout and revoke tokens',
        },
        tasks: {
          list: 'GET /tasks - Get all tasks (protected)',
          get: 'GET /tasks/:id - Get task by ID (protected)',
          create: 'POST /tasks - Create new task (protected)',
          update: 'PATCH /tasks/:id - Update task (protected)',
          delete: 'DELETE /tasks/:id - Delete task (protected)',
        },
      },
    };
  });

  // Register auth routes
  await fastify.register(authRoutes);

  // Register task routes
  await fastify.register(taskRoutes);
}

// Start server
const start = async () => {
  try {
    // Register plugins first
    await registerPlugins();

    // Then register routes
    await registerRoutes();

    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log('');
    console.log('🚀 Server is running!');
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🌍 Network: http://${getLocalIP()}:${port}`);
    console.log('');
    console.log('📚 Available endpoints:');
    console.log('  ✓ GET  /health - Health check');
    console.log('  ✓ GET  / - API documentation');
    console.log('');
    console.log('🔐 Authentication:');
    console.log('  ✓ POST /auth/google - Google OAuth login');
    console.log('  ✓ POST /auth/refresh - Refresh access token');
    console.log('  ✓ POST /auth/verify - Verify token');
    console.log('  ✓ GET  /auth/me - Get current user');
    console.log('  ✓ POST /auth/logout - Logout');
    console.log('');
    console.log('📝 Tasks (Protected):');
    console.log('  ✓ GET    /tasks - List all tasks');
    console.log('  ✓ GET    /tasks/:id - Get task');
    console.log('  ✓ POST   /tasks - Create task');
    console.log('  ✓ PATCH  /tasks/:id - Update task');
    console.log('  ✓ DELETE /tasks/:id - Delete task');
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Get local IP address
function getLocalIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();
