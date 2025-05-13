"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_services_1 = require("../services/auth.services");
const api_1 = require("../utils/api");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
exports.authRouter = router;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'CUSTOMER']).optional(),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});
router.post('/login', 
//  validate(loginSchema),
async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        const result = await auth_services_1.AuthService.login(email, password);
        res.json(result);
    }
    catch (error) {
        // res.json(error).status(500)
        next(error);
    }
});
router.post('/register', 
// validate(registerSchema),
async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const user = await auth_services_1.AuthService.register(email, password, firstName, lastName, role);
        api_1.APIResponse.success(res, user, 'Registration successful');
    }
    catch (error) {
        next(error);
    }
});
router.post('/refresh', (0, validate_1.validate)(refreshTokenSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await auth_services_1.AuthService.refreshToken(refreshToken);
        api_1.APIResponse.success(res, result, 'Token refreshed');
    }
    catch (error) {
        next(error);
    }
});
router.post('/request-reset', (0, validate_1.validate)(zod_1.z.object({ email: zod_1.z.string().email() })), async (req, res, next) => {
    try {
        const { email } = req.body;
        const token = await auth_services_1.AuthService.generateResetToken(email, 'RESET_LINK');
        api_1.APIResponse.success(res, { token }, 'Reset token generated');
    }
    catch (error) {
        next(error);
    }
});
router.post('/reset-password', (0, validate_1.validate)(resetPasswordSchema), async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await auth_services_1.AuthService.resetPassword(token, newPassword);
        api_1.APIResponse.success(res, null, 'Password reset successful');
    }
    catch (error) {
        next(error);
    }
});
