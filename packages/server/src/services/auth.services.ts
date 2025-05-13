import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { APIError } from '../utils/error';
import prisma from '../prisma/prisma-client';

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn;
const REFRESH_TOKEN_EXPIRES_IN = '30d';

interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
  refreshToken: string;
}

export const AuthService = {
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role: Role = Role.USER
  ): Promise<Omit<User, 'passwordHash'>> {
    // Validate email format
    z.string().email().parse(email);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new APIError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role,
        isActive: true,
        isVerified: role === Role.USER ? false : true, // Require email verification for regular users
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { Customer: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new APIError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new APIError('Account is disabled', 403);
    }

    // if (!user.isVerified) {
    //   throw new APIError('Email not verified', 403);
    // }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = await this.generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
      refreshToken,
    };
  },

  async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, JWT_SECRET, { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN 
    });

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return token;
  },

  async refreshToken(token: string): Promise<LoginResponse> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      throw new APIError('Invalid or expired refresh token', 401);
    }

    const user = refreshToken.user;
    if (!user.isActive) {
      throw new APIError('Account is disabled', 403);
    }

    const newToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: Number(JWT_EXPIRES_IN) }
    );

    const newRefreshToken = await this.generateRefreshToken(user.id);
    
    // Revoke the old refresh token
    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { 
        revokedAt: new Date(),
        replacedByToken: newRefreshToken,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: newToken,
      refreshToken: newRefreshToken,
    };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new APIError('Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  },

  async generateResetToken(email: string, type: 'VERIFICATION_CODE' | 'RESET_LINK'): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Revoke any existing tokens of the same type
    await prisma.resetToken.updateMany({
      where: { 
        userId: user.id,
        type,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    await prisma.resetToken.create({
      data: {
        userId: user.id,
        email,
        token,
        type,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    return token;
  },

  async verifyResetToken(token: string): Promise<User> {
    const resetToken = await prisma.resetToken.findFirst({
      where: { 
        token,
        usedAt: null,
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new APIError('Invalid token', 401);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new APIError('Token has expired', 401);
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new APIError('Invalid token', 401);
    }

    return resetToken.user;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.resetToken.findFirst({
      where: { 
        token,
        usedAt: null,
      },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new APIError('Invalid or expired token', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.resetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for this user
      prisma.refreshToken.updateMany({
        where: { 
          userId: resetToken.user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await this.verifyResetToken(token);
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  },
};