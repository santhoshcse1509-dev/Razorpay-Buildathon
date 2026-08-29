import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { config, getSecretStatus } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbError: string | null = null;
  let entityCounts = {
    users: 0,
    products: 0,
    orders: 0,
    cartItems: 0,
    conversations: 0,
  };

  try {
    // Quick test query to verify database connectivity
    const [users, products, orders, cartItems, conversations] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.cartItem.count(),
      prisma.conversation.count(),
    ]);

    entityCounts = { users, products, orders, cartItems, conversations };
  } catch (err: any) {
    dbStatus = 'degraded';
    dbError = err.message || 'Failed to query database';
  }

  const responseTimeMs = Date.now() - startTime;

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: 'ok',
    service: 'Agentic Commerce Assistant API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    database: {
      status: dbStatus,
      type: 'Prisma ORM (SQLite local / PostgreSQL ready)',
      responseTimeMs,
      error: dbError,
      counts: entityCounts,
    },
    secretsConfigured: getSecretStatus(),
  });
});
