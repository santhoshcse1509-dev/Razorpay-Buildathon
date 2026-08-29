import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { usersRouter } from './routes/users.js';
import { ordersRouter } from './routes/orders.js';
import { conversationsRouter } from './routes/conversations.js';
import { statsRouter } from './routes/stats.js';
import { agentRouter } from './routes/agent.js';
import { adminRouter } from './routes/admin.js';

export function createBackendApp() {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root Agent endpoints (for direct /agent/chat spec support)
  app.use('/agent', agentRouter);

  // Root Admin endpoints (for direct /admin/analytics spec support)
  app.use('/admin', adminRouter);

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/agent', agentRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/stats', statsRouter);

  // Backend root "hello world" endpoint
  app.get('/api/hello', (_req, res) => {
    res.json({
      message: 'Hello from Agentic Commerce Assistant Backend!',
      timestamp: new Date().toISOString(),
      status: 'operational',
    });
  });

  return app;
}

export default createBackendApp;
