import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Secrets (read strictly from process.env, never hardcoded)
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-fallback-secret-for-scaffolding',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-6',
  },
  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
};

export function getSecretStatus() {
  return {
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    anthropicApiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    razorpayKeyIdConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
    razorpayKeySecretConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET),
    googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
    googleClientSecretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  };
}
