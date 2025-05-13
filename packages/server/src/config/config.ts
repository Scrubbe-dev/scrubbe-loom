import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.string().default('5000'),
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.number().positive().default(86400),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
  clientUrl: z.string().default('http://localhost:3000'),
  databaseUrl: z.string().url(),
  shadowDatabaseUrl: z.string().url().optional(),
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

export const config = {
  ...parsedConfig.data,
  isProduction: parsedConfig.data.nodeEnv === 'production',
  isDevelopment: parsedConfig.data.nodeEnv === 'development',
  isTest: parsedConfig.data.nodeEnv === 'test',
};