import type { RefreshToken, User } from '@prisma/client';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';

interface GoogleUserData {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
  locale?: string;
  hd?: string;
}

export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * Verify Google ID token and extract user data
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUserData> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Additional security checks
      if (!payload.email_verified) {
        throw new Error('Email not verified by Google');
      }

      if (
        payload.iss !== 'accounts.google.com' &&
        payload.iss !== 'https://accounts.google.com'
      ) {
        throw new Error('Invalid token issuer');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name,
        avatar: payload.picture,
        locale: payload.locale,
        hd: payload.hd, // Google Workspace domain
      };
    } catch (error) {
      throw new Error(`Google token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find or create user in database
   */
  async findOrCreateUser(googleUserData: GoogleUserData): Promise<User> {
    try {
      // Try to find existing user by googleId or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleUserData.googleId },
            { email: googleUserData.email },
          ],
        },
      });

      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUserData.name,
            avatar: googleUserData.avatar,
            lastLogin: new Date(),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: googleUserData.googleId,
            email: googleUserData.email,
            name: googleUserData.name,
            avatar: googleUserData.avatar,
            lastLogin: new Date(),
          },
        });
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to find or create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate and store refresh token
   */
  async generateRefreshToken(userId: number): Promise<RefreshToken> {
    try {
      // Generate secure random token
      const token = crypto.randomBytes(40).toString('hex');
      
      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      const expiryDays = parseInt(process.env.JWT_REFRESH_EXPIRY?.replace('d', '') || '7', 10);
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Store in database
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });

      return refreshToken;
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshToken & { user: User }> {
    try {
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!refreshToken) {
        throw new Error('Invalid refresh token');
      }

      if (refreshToken.revoked) {
        throw new Error('Refresh token has been revoked');
      }

      if (refreshToken.expiresAt < new Date()) {
        throw new Error('Refresh token has expired');
      }

      return refreshToken;
    } catch (error) {
      throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke refresh token (for logout or token rotation)
   */
  async revokeRefreshToken(token: string, replacedByToken?: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          OR: [
            { token },
            { replacedByToken: token },
          ],
        },
        data: {
          revoked: true,
          replacedByToken,
        },
      });
    } catch (error) {
      throw new Error(`Failed to revoke refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired refresh tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { revoked: true },
          ],
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to cleanup expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke all refresh tokens for a user (for security purposes)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    } catch (error) {
      throw new Error(`Failed to revoke user tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
