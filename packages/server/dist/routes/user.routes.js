"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const authorize_1 = require("../middlewares/authorize");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const auth_services_1 = require("../services/auth.services");
const router = (0, express_1.Router)();
exports.userRouter = router;
router.use(authenticate_1.authenticate);
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'CUSTOMER']).optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(8),
    newPassword: zod_1.z.string().min(8),
});
router.get('/me', async (req, res, next) => {
    try {
        const user = await prisma?.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLogin: true,
                Customer: { select: { id: true, name: true } },
            },
        });
        api_1.APIResponse.success(res, user);
    }
    catch (error) {
        next(error);
    }
});
router.put('/me', (0, validate_1.validate)(updateUserSchema), async (req, res, next) => {
    try {
        const user = await prisma?.user.update({
            where: { id: req.user?.id },
            data: req.body,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });
        api_1.APIResponse.success(res, user, 'Profile updated');
    }
    catch (error) {
        next(error);
    }
});
router.post('/me/change-password', (0, validate_1.validate)(changePasswordSchema), async (req, res, next) => {
    try {
        await auth_services_1.AuthService?.changePassword(req.user?.id, req.body.currentPassword, req.body.newPassword);
        api_1.APIResponse.success(res, null, 'Password changed successfully');
    }
    catch (error) {
        next(error);
    }
});
router.get('/', (0, authorize_1.authorize)([client_1.Role.ADMIN]), async (req, res, next) => {
    try {
        const users = await prisma?.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLogin: true,
                Customer: { select: { id: true, name: true } },
            },
        });
        api_1.APIResponse.success(res, users);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', (0, authorize_1.authorize)([client_1.Role.ADMIN]), (0, validate_1.validate)(updateUserSchema), async (req, res, next) => {
    try {
        const user = await prisma?.user.update({
            where: { id: req.params.id },
            data: req.body,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
        api_1.APIResponse.success(res, user, 'User updated');
    }
    catch (error) {
        next(error);
    }
});
