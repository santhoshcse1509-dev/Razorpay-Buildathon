import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const usersRouter = Router();

// GET /api/users - list all users (without exposing password hashes)
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        googleId: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            cartItems: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
