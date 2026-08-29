import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const conversationsRouter = Router();

// GET /api/conversations - list sample conversations with messages & agent actions
conversationsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = conversations.map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => ({
        ...m,
        toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : null,
      })),
      actions: conv.actions.map((a) => ({
        ...a,
        payload: a.payload ? JSON.parse(a.payload) : null,
      })),
    }));

    res.json({
      success: true,
      count: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
