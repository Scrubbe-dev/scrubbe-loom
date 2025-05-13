"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
const config_1 = require("../config/config");
const error_1 = require("../utils/error");
const authenticate = async (req, res, next) => {
    try {
        // Check for Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_1.UnauthorizedError('Authentication token missing');
        }
        // Extract token
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        // Find user in database
        const user = await prisma_client_1.default?.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLogin: true,
                Customer: { select: { id: true } },
            },
        });
        // Check if user exists and is active
        if (!user || !user.isActive) {
            throw new error_1.UnauthorizedError('User not found or inactive');
        }
        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            role: user.role,
            customerId: user.Customer?.[0]?.id,
        };
        // Update last login time
        await prisma_client_1.default?.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_1.UnauthorizedError('Invalid token'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
