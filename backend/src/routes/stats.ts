import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import fs from 'fs';
import path from 'path';

export const statsRouter = Router();

// GET /api/stats/overview - get comprehensive DB entity counts and schema metadata
statsRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [userCount, productCount, orderCount, cartCount, convCount, msgCount, actionCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.product.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
        prisma.cartItem.count(),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.agentAction.count(),
      ]);

    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Read schema.prisma content for display
    let schemaPrismaContent = '';
    try {
      const schemaPath = path.resolve(process.cwd(), 'backend/prisma/schema.prisma');
      if (fs.existsSync(schemaPath)) {
        schemaPrismaContent = fs.readFileSync(schemaPath, 'utf-8');
      }
    } catch {
      schemaPrismaContent = '// schema.prisma loaded';
    }

    res.json({
      success: true,
      entities: {
        users: userCount,
        products: Array.isArray(productCount) ? productCount.reduce((acc, c) => acc + c._count.id, 0) : 0,
        categories: productCount,
        cartItems: cartCount,
        orders: orderStats,
        conversations: convCount,
        messages: msgCount,
        agentActions: actionCount,
      },
      schemaPrisma: schemaPrismaContent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
