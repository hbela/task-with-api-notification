import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AuthService } from '../services/authService';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  /**
   * POST /auth/google
   * Authenticate with Google ID token
   */
  fastify.post<{
    Body: {
      idToken: string;
      deviceInfo?: {
        platform?: string;
        version?: string;
      };
    };
  }>(
    '/auth/google',
    {
      schema: {
        body: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string' },
            deviceInfo: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                version: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { idToken, deviceInfo } = request.body;

        // 1. Verify Google token
        const googleUser = await authService.verifyGoogleToken(idToken);

        // 2. Find or create user
        const user = await authService.findOrCreateUser(googleUser);

        // 3. Generate JWT access token
        const accessToken = fastify.jwt.sign(
          {
            sub: user.id,
            email: user.email,
            type: 'access',
          },
          {
            expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
          }
        );

        // 4. Generate refresh token
        const refreshToken = await authService.generateRefreshToken(user.id);

        // 5. Set HTTP-only cookie for web clients (optional)
        reply.setCookie('refreshToken', refreshToken.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
          path: '/',
        });

        // 6. Log device info if provided
        if (deviceInfo) {
          fastify.log.info({
            userId: user.id,
            deviceInfo,
            action: 'login',
          });
        }

        // 7. Return response
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
          token: accessToken,
          refreshToken: refreshToken.token, // For mobile apps
          expiresIn: 15 * 60, // 15 minutes in seconds
        };
      } catch (error) {
        fastify.log.error({ error }, 'Google auth error');
        return reply.code(401).send({
          error: 'Authentication failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{
    Body: {
      refreshToken?: string;
    };
  }>('/auth/refresh', async (request, reply) => {
    try {
      // Get refresh token from body or cookie
      let refreshTokenValue = request.body.refreshToken;
      
      if (!refreshTokenValue) {
        refreshTokenValue = request.cookies.refreshToken;
      }

      if (!refreshTokenValue) {
        return reply.code(401).send({
          error: 'No refresh token provided',
          code: 'NO_REFRESH_TOKEN',
        });
      }

      // 1. Verify refresh token
      const tokenData = await authService.verifyRefreshToken(refreshTokenValue);

      // 2. Revoke old refresh token (token rotation for security)
      await authService.revokeRefreshToken(refreshTokenValue);

      // 3. Generate new access token
      const accessToken = fastify.jwt.sign(
        {
          sub: tokenData.user.id,
          email: tokenData.user.email,
          type: 'access',
        },
        {
          expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        }
      );

      // 4. Generate new refresh token
      const newRefreshToken = await authService.generateRefreshToken(
        tokenData.user.id
      );

      // 5. Update cookie
      reply.setCookie('refreshToken', newRefreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      // 6. Return new tokens
      return {
        token: accessToken,
        refreshToken: newRefreshToken.token,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Token refresh error');
      return reply.code(401).send({
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'REFRESH_FAILED',
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout and revoke refresh token
   */
  fastify.post<{
    Body: {
      refreshToken?: string;
    };
  }>('/auth/logout', async (request, reply) => {
    try {
      // Get refresh token from body or cookie
      let refreshTokenValue = request.body.refreshToken;
      
      if (!refreshTokenValue) {
        refreshTokenValue = request.cookies.refreshToken;
      }

      if (refreshTokenValue) {
        await authService.revokeRefreshToken(refreshTokenValue);
      }

      // Clear cookie
      reply.clearCookie('refreshToken', { path: '/' });

      return { message: 'Logged out successfully' };
    } catch (error) {
      fastify.log.error({ error }, 'Logout error');
      return reply.code(400).send({
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user profile (protected route)
   */
  fastify.get(
    '/auth/me',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        if (!request.currentUser) {
          return reply.code(401).send({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
          where: { id: request.currentUser.id },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            lastLogin: true,
            createdAt: true,
          },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return { user };
      } catch (error) {
        fastify.log.error({ error }, 'Get user error');
        return reply.code(500).send({
          error: 'Failed to get user',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /auth/verify
   * Verify if token is valid (doesn't refresh)
   */
  fastify.post(
    '/auth/verify',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // If we reach here, token is valid (middleware verified it)
      return {
        valid: true,
        user: request.currentUser,
      };
    }
  );
}
