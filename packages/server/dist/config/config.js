"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const configSchema = zod_1.z.object({
    nodeEnv: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    port: zod_1.z.string().default('5000'),
    jwtSecret: zod_1.z.string().min(32),
    jwtExpiresIn: zod_1.z.number().positive().default(86400),
    smtpHost: zod_1.z.string().optional(),
    smtpPort: zod_1.z.number().optional(),
    smtpSecure: zod_1.z.boolean().default(false),
    smtpUser: zod_1.z.string().optional(),
    smtpPass: zod_1.z.string().optional(),
    smtpFrom: zod_1.z.string().optional(),
    clientUrl: zod_1.z.string().default('http://localhost:3000'),
    databaseUrl: zod_1.z.string().url(),
    shadowDatabaseUrl: zod_1.z.string().url().optional(),
});
const confignew = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN),
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,
    clientUrl: process.env.CLIENT_URL,
    databaseUrl: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
};
const parsedConfig = configSchema.safeParse(confignew);
if (!parsedConfig.success) {
    console.error('❌ Invalid environment variables:', parsedConfig.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
}
exports.config = {
    ...parsedConfig.data,
    isProduction: parsedConfig.data.nodeEnv === 'production',
    isDevelopment: parsedConfig.data.nodeEnv === 'development',
    isTest: parsedConfig.data.nodeEnv === 'test',
};
