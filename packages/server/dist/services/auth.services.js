"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const config_1 = require("../config/config");
const error_1 = require("../utils/error");
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
const JWT_SECRET = config_1.config.jwtSecret;
const JWT_EXPIRES_IN = config_1.config.jwtExpiresIn;
const REFRESH_TOKEN_EXPIRES_IN = '30d';
exports.AuthService = {
    async register(email, password, firstName, lastName, role = client_1.Role.USER) {
        // Validate email format
        zod_1.z.string().email().parse(email);
        const existingUser = await prisma_client_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new error_1.APIError('User already exists', 409);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_client_1.default.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                role,
                isActive: true,
                isVerified: role === client_1.Role.USER ? false : true, // Require email verification for regular users
            },
        });
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
    async login(email, password) {
        const user = await prisma_client_1.default.user.findUnique({
            where: { email },
            include: { Customer: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            throw new error_1.APIError('Invalid credentials', 401);
        }
        if (!user.isActive) {
            throw new error_1.APIError('Account is disabled', 403);
        }
        // if (!user.isVerified) {
        //   throw new APIError('Email not verified', 403);
        // }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = await this.generateRefreshToken(user.id);
        await prisma_client_1.default.user.update({
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
    async generateRefreshToken(userId) {
        const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        });
        await prisma_client_1.default.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
        return token;
    },
    async refreshToken(token) {
        const refreshToken = await prisma_client_1.default.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
            throw new error_1.APIError('Invalid or expired refresh token', 401);
        }
        const user = refreshToken.user;
        if (!user.isActive) {
            throw new error_1.APIError('Account is disabled', 403);
        }
        const newToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: Number(JWT_EXPIRES_IN) });
        const newRefreshToken = await this.generateRefreshToken(user.id);
        // Revoke the old refresh token
        await prisma_client_1.default.refreshToken.update({
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
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_client_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new error_1.APIError('User not found', 404);
        }
        if (!(await bcryptjs_1.default.compare(currentPassword, user.passwordHash))) {
            throw new error_1.APIError('Current password is incorrect', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_client_1.default.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                passwordChangedAt: new Date(),
            },
        });
    },
    async generateResetToken(email, type) {
        const user = await prisma_client_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_1.APIError('User not found', 404);
        }
        // Revoke any existing tokens of the same type
        await prisma_client_1.default.resetToken.updateMany({
            where: {
                userId: user.id,
                type,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });
        const token = jsonwebtoken_1.default.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
        await prisma_client_1.default.resetToken.create({
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
    async verifyResetToken(token) {
        const resetToken = await prisma_client_1.default.resetToken.findFirst({
            where: {
                token,
                usedAt: null,
            },
            include: { user: true },
        });
        if (!resetToken) {
            throw new error_1.APIError('Invalid token', 401);
        }
        if (resetToken.expiresAt < new Date()) {
            throw new error_1.APIError('Token has expired', 401);
        }
        try {
            jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new error_1.APIError('Invalid token', 401);
        }
        return resetToken.user;
    },
    async resetPassword(token, newPassword) {
        const resetToken = await prisma_client_1.default.resetToken.findFirst({
            where: {
                token,
                usedAt: null,
            },
            include: { user: true },
        });
        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new error_1.APIError('Invalid or expired token', 401);
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_client_1.default.$transaction([
            prisma_client_1.default.user.update({
                where: { id: resetToken.user.id },
                data: {
                    passwordHash: hashedPassword,
                    passwordChangedAt: new Date(),
                },
            }),
            prisma_client_1.default.resetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
            // Revoke all refresh tokens for this user
            prisma_client_1.default.refreshToken.updateMany({
                where: {
                    userId: resetToken.user.id,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            }),
        ]);
    },
    async verifyEmail(token) {
        const user = await this.verifyResetToken(token);
        await prisma_client_1.default.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });
    },
};
