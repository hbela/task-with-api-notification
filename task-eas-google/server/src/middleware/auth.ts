import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 1. Get token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'No authorization header',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.substring(7);

    // 2. Verify JWT using Fastify JWT plugin
    try {
      await request.jwtVerify();
    } catch (err) {
      // Handle specific JWT errors
      if (err instanceof Error) {
        if (err.message.includes('expired')) {
          return reply.code(401).send({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED',
            message: 'Please refresh your token',
          });
        }
      }
      
      return reply.code(401).send({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    // 3. Get decoded token payload
    const decoded = request.user as any;

    // 4. Additional checks
    if (decoded.type !== 'access') {
      return reply.code(401).send({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    // 5. Verify user still exists in database (extra security)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      return reply.code(401).send({
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND',
      });
    }

    // 6. Attach user to request
    request.currentUser = {
      id: user.id,
      email: user.email,
    };

  } catch (error) {
    request.log.error({ error }, 'Authentication error');
    return reply.code(500).send({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export async function optionalAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return;
    }

    await request.jwtVerify();
    const decoded = request.user as any;

    if (decoded.type === 'access') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true },
      });

      if (user) {
        request.currentUser = {
          id: user.id,
          email: user.email,
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    request.log.debug({ error }, 'Optional authentication failed');
  }
}
