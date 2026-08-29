import { Router, Request, Response } from 'express';
import {
  handleAgentChat,
  generateAbandonedCartNudge,
  generatePostPurchaseCrossSell,
} from '../services/agentService.js';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

export const agentRouter = Router();

/**
 * POST /agent/chat and POST /api/agent/chat
 * Accepts: { conversationId, userId, message }
 * Executes Claude function-calling with live database tools, logs actions, saves messages
 */
agentRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, userId: requestedUserId, message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message parameter is required and cannot be empty.',
      });
      return;
    }

    // Determine user ID from auth header, body, or default demo user
    let userId = requestedUserId;
    if (!userId && (req as any).user?.id) {
      userId = (req as any).user.id;
    }
    if (!userId) {
      // Fetch default active customer
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'user' },
      });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    const result = await handleAgentChat({
      conversationId,
      userId,
      message: message.trim(),
    });

    res.json(result);
  } catch (error: any) {
    console.error('Agent chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while executing agent chat.',
    });
  }
});

/**
 * GET /api/agent/conversations/:id
 * Returns conversation messages and logged agent actions
 */
agentRouter.get('/conversations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    const parsedMessages = conversation.messages.map((m) => ({
      ...m,
      toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : null,
    }));

    const parsedActions = conversation.actions.map((a) => ({
      ...a,
      payload: a.payload ? JSON.parse(a.payload) : null,
    }));

    res.json({
      success: true,
      conversation: {
        ...conversation,
        messages: parsedMessages,
        actions: parsedActions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent/actions
 * Returns logged AgentAction records (powers Phase 4 analytics & Phase 2 verification)
 */
agentRouter.get('/actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50 } = req.query;

    const actions = await prisma.agentAction.findMany({
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const parsed = actions.map((a) => ({
      ...a,
      payload: a.payload ? JSON.parse(a.payload) : null,
    }));

    res.json({
      success: true,
      count: parsed.length,
      actions: parsed,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent/cart/:userId or GET /api/agent/cart
 * Returns the current database cart items for the user
 */
agentRouter.get('/cart/:userId?', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = req.params.userId || (req as any).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'user' } });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      userId,
      items: cartItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: {
          ...item.product,
          tags: (() => {
            try {
              return JSON.parse(item.product.tags);
            } catch {
              return item.product.tags.split(',');
            }
          })(),
        },
      })),
      totalAmount,
      totalCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/agent/cart/item/:productId
 */
agentRouter.delete('/cart/item/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    let userId = (req.query.userId as string) || (req as any).user?.id || 'usr_cust_01';

    await prisma.cartItem.deleteMany({
      where: { userId, productId },
    });

    res.json({ success: true, message: 'Item removed from database cart.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/agent/cart/clear
 */
agentRouter.delete('/cart/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = (req.query.userId as string) || (req as any).user?.id || 'usr_cust_01';

    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    res.json({ success: true, message: 'Database cart cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent/cart/item or PUT /api/agent/cart/item
 * Updates quantity or adds item to database cart
 */
agentRouter.post('/cart/item', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;
    let userId = req.body.userId || (req as any).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'user' } });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    if (!productId) {
      res.status(400).json({ success: false, error: 'productId is required.' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    const numQty = Math.max(1, parseInt(quantity, 10) || 1);

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let updatedCartItem;
    if (existing) {
      updatedCartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + numQty },
      });
    } else {
      updatedCartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity: numQty,
        },
      });
    }

    // Get current cart totals
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    res.json({
      success: true,
      message: `Added ${product.name} to cart.`,
      cartItem: updatedCartItem,
      totalCount,
      totalAmount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentRouter.put('/cart/item', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;
    let userId = req.body.userId || (req as any).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'user' } });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    if (!productId || quantity === undefined) {
      res.status(400).json({ success: false, error: 'productId and quantity are required.' });
      return;
    }

    const numQty = parseInt(quantity, 10);
    if (numQty <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, productId },
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        update: { quantity: numQty },
        create: {
          userId,
          productId,
          quantity: numQty,
        },
      });
    }

    // Fetch updated items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    res.json({
      success: true,
      message: 'Cart quantity updated.',
      totalCount,
      totalAmount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/nudge and POST /api/agent/nudge
 * Generates personalized abandoned cart nudge copy referencing user's actual items,
 * logs it to the Notification table, and returns the response.
 */
agentRouter.post('/nudge', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = req.body.userId || (req as any).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'user' } });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    const result = await generateAbandonedCartNudge(userId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/post-purchase and POST /api/agent/post-purchase
 * Generates personalized thank you note + 1 cross-sell recommendation for a completed order
 */
agentRouter.post('/post-purchase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ success: false, error: 'orderId is required.' });
      return;
    }

    const result = await generatePostPurchaseCrossSell(orderId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent/notifications
 * Returns logged notifications (abandoned cart nudges, post-purchase, etc.)
 */
agentRouter.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = (req.query.userId as string) || (req as any).user?.id;

    const where = userId ? { userId } : {};
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const parsed = notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));

    res.json({
      success: true,
      count: parsed.length,
      notifications: parsed,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

