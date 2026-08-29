import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

export const adminRouter = Router();

// Apply admin authentication to all routes in adminRouter
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

/**
 * GET /admin/analytics (also mounted at /api/admin/analytics)
 * Returns comprehensive e-commerce analytics including:
 * - Conversion rate = paid orders / unique users who viewed >= 1 product
 * - Cart abandonment rate = carts with items that never became a paid order within 24h / total carts created
 * - Agent-assisted vs self-service purchase ratio = orders where purchased product appears in AgentAction (add_to_cart or recommend) vs no matching AgentAction
 * - Top agent recommendations = most frequent productIds in AgentAction where actionType='recommend'
 * - Time series data for conversion rate over time
 */
adminRouter.get('/analytics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rangeParam = (req.query.range as string) || '30d';
    const now = new Date();
    let startDate: Date;

    if (rangeParam === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (rangeParam === '14d') {
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (rangeParam === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (rangeParam === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (rangeParam === 'all') {
      startDate = new Date(0); // Beginning of epoch
    } else if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : now;

    // ------------------------------------------------------------------------
    // 1. FETCH BASE DATA FROM DATABASE WITHIN DATE RANGE
    // ------------------------------------------------------------------------
    const [
      productViews,
      allOrders,
      cartSessions,
      agentActions,
      allProducts,
      conversations,
      users,
    ] = await Promise.all([
      // Product Views in range
      prisma.productView.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Orders in range (with items and user)
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Cart Sessions in range
      prisma.cartSession.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Agent Actions in range (and slightly earlier for matching)
      prisma.agentAction.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // include actions within 7d before range
            lte: endDate,
          },
        },
        include: {
          conversation: {
            select: { id: true, userId: true },
          },
        },
      }),

      // Product catalog for name lookup
      prisma.product.findMany(),

      // Conversations count in range
      prisma.conversation.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Users count in range
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    // Filter paid orders
    const paidOrders = allOrders.filter((o) => o.status === 'paid');
    const pendingOrders = allOrders.filter((o) => o.status === 'pending');
    const failedOrders = allOrders.filter((o) => o.status === 'failed');

    // ------------------------------------------------------------------------
    // METRIC 1: CONVERSION RATE
    // Definition: paid orders / unique users who viewed >= 1 product
    // ------------------------------------------------------------------------
    const uniqueViewersSet = new Set<string>();
    productViews.forEach((v) => {
      if (v.userId) {
        uniqueViewersSet.add(v.userId);
      } else {
        uniqueViewersSet.add(`anon_${v.id}`);
      }
    });

    const uniqueProductViewersCount = uniqueViewersSet.size;
    const paidOrdersCount = paidOrders.length;
    const conversionRate =
      uniqueProductViewersCount > 0
        ? Number(((paidOrdersCount / uniqueProductViewersCount) * 100).toFixed(2))
        : 0;

    // ------------------------------------------------------------------------
    // METRIC 2: CART ABANDONMENT RATE
    // Definition: carts with items that never became a paid order within 24h / total carts created
    // ------------------------------------------------------------------------
    const totalCartsCreated = cartSessions.length;
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const abandonedCarts = cartSessions.filter((c) => {
      if (c.status === 'abandoned') return true;
      if (c.status === 'converted') return false;
      // Active cart where >24h elapsed since creation without conversion
      const ageMs = now.getTime() - new Date(c.createdAt).getTime();
      return ageMs >= twentyFourHoursMs;
    });

    const abandonedCartsCount = abandonedCarts.length;
    const convertedCartsCount = totalCartsCreated - abandonedCartsCount;
    const cartAbandonmentRate =
      totalCartsCreated > 0
        ? Number(((abandonedCartsCount / totalCartsCreated) * 100).toFixed(2))
        : 0;

    // ------------------------------------------------------------------------
    // METRIC 3: AGENT-ASSISTED VS SELF-SERVICE PURCHASE RATIO
    // Definition: orders where the purchased product appears in an AgentAction
    // with type 'add_to_cart' or 'recommend' for that user's conversation,
    // vs orders with no matching AgentAction
    // ------------------------------------------------------------------------
    // Build lookup of (userId -> Set of productIds interacted with via agent add_to_cart or recommend)
    const userAgentProductMap = new Map<string, Set<string>>();

    agentActions.forEach((action) => {
      if (action.actionType === 'add_to_cart' || action.actionType === 'recommend') {
        const userId = action.conversation.userId;
        if (!userAgentProductMap.has(userId)) {
          userAgentProductMap.set(userId, new Set<string>());
        }

        try {
          const payload = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
          if (payload?.productId) {
            userAgentProductMap.get(userId)!.add(payload.productId);
          }
          if (Array.isArray(payload?.productIds)) {
            payload.productIds.forEach((pid: string) => userAgentProductMap.get(userId)!.add(pid));
          }
          if (Array.isArray(payload?.items)) {
            payload.items.forEach((item: any) => {
              if (item.productId) userAgentProductMap.get(userId)!.add(item.productId);
            });
          }
        } catch {
          // ignore parsing error
        }
      }
    });

    let agentAssistedOrdersCount = 0;
    let selfServiceOrdersCount = 0;
    let agentAssistedRevenue = 0;
    let selfServiceRevenue = 0;

    const classifiedPaidOrders = paidOrders.map((order) => {
      const userAgentProducts = userAgentProductMap.get(order.userId) || new Set<string>();
      const hasMatchingAgentAction = order.items.some((item) => userAgentProducts.has(item.productId));

      if (hasMatchingAgentAction) {
        agentAssistedOrdersCount += 1;
        agentAssistedRevenue += order.totalAmount;
      } else {
        selfServiceOrdersCount += 1;
        selfServiceRevenue += order.totalAmount;
      }

      return {
        id: order.id,
        userId: order.userId,
        userName: order.user?.name || 'Customer',
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        isAgentAssisted: hasMatchingAgentAction,
        itemsCount: order.items.length,
      };
    });

    const totalPaidOrders = paidOrders.length;
    const agentAssistedPercentage =
      totalPaidOrders > 0
        ? Number(((agentAssistedOrdersCount / totalPaidOrders) * 100).toFixed(1))
        : 0;
    const selfServicePercentage =
      totalPaidOrders > 0
        ? Number(((selfServiceOrdersCount / totalPaidOrders) * 100).toFixed(1))
        : 0;

    // ------------------------------------------------------------------------
    // METRIC 4: TOP AGENT RECOMMENDATIONS
    // Definition: most frequent productIds in AgentAction where actionType='recommend', with counts
    // ------------------------------------------------------------------------
    const recommendationCountMap = new Map<string, { count: number; reasons: string[] }>();

    agentActions.forEach((action) => {
      if (action.actionType === 'recommend') {
        try {
          const payload = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
          const productId = payload?.productId || payload?.id;

          if (productId) {
            if (!recommendationCountMap.has(productId)) {
              recommendationCountMap.set(productId, { count: 0, reasons: [] });
            }
            const rec = recommendationCountMap.get(productId)!;
            rec.count += 1;
            if (payload.reason && !rec.reasons.includes(payload.reason) && rec.reasons.length < 3) {
              rec.reasons.push(payload.reason);
            }
          }
        } catch {
          // ignore parse error
        }
      }
    });

    // Also calculate how many times this product was ordered in paid orders
    const productSalesMap = new Map<string, { unitsSold: number; totalRevenue: number }>();
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSalesMap.has(item.productId)) {
          productSalesMap.set(item.productId, { unitsSold: 0, totalRevenue: 0 });
        }
        const s = productSalesMap.get(item.productId)!;
        s.unitsSold += item.quantity;
        s.totalRevenue += item.quantity * item.priceAtPurchase;
      });
    });

    const topRecommendations = Array.from(recommendationCountMap.entries())
      .map(([productId, rec]) => {
        const prod = productMap.get(productId);
        const sales = productSalesMap.get(productId) || { unitsSold: 0, totalRevenue: 0 };
        return {
          productId,
          productName: prod?.name || `Product (${productId})`,
          category: prod?.category || 'General',
          price: prod?.price || 0,
          stock: prod?.stock || 0,
          imageUrl: prod?.imageUrl || null,
          recommendationCount: rec.count,
          sampleReason: rec.reasons[0] || 'High affinity match for user query',
          conversionsCount: sales.unitsSold,
          revenueGenerated: sales.totalRevenue,
          conversionRate:
            rec.count > 0 ? Number(((sales.unitsSold / rec.count) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.recommendationCount - a.recommendationCount);

    // ------------------------------------------------------------------------
    // 5. TIME SERIES DATA (Conversion Rate Over Time)
    // Daily intervals across date range
    // ------------------------------------------------------------------------
    const dayMs = 24 * 60 * 60 * 1000;
    const numDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
    const timeSeriesMap = new Map<string, {
      date: string;
      label: string;
      views: number;
      uniqueViewersSet: Set<string>;
      paidOrders: number;
      revenue: number;
      cartsCreated: number;
      abandonedCarts: number;
      agentAssistedOrders: number;
      selfServiceOrders: number;
    }>();

    // Initialize daily buckets
    for (let i = 0; i < Math.min(numDays, 90); i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timeSeriesMap.set(dateStr, {
        date: dateStr,
        label,
        views: 0,
        uniqueViewersSet: new Set<string>(),
        paidOrders: 0,
        revenue: 0,
        cartsCreated: 0,
        abandonedCarts: 0,
        agentAssistedOrders: 0,
        selfServiceOrders: 0,
      });
    }

    // Populate views
    productViews.forEach((v) => {
      const dateStr = new Date(v.createdAt).toISOString().split('T')[0];
      const bucket = timeSeriesMap.get(dateStr);
      if (bucket) {
        bucket.views += 1;
        bucket.uniqueViewersSet.add(v.userId || `anon_${v.id}`);
      }
    });

    // Populate carts
    cartSessions.forEach((c) => {
      const dateStr = new Date(c.createdAt).toISOString().split('T')[0];
      const bucket = timeSeriesMap.get(dateStr);
      if (bucket) {
        bucket.cartsCreated += 1;
        if (c.status === 'abandoned') {
          bucket.abandonedCarts += 1;
        }
      }
    });

    // Populate orders
    paidOrders.forEach((o) => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      const bucket = timeSeriesMap.get(dateStr);
      if (bucket) {
        bucket.paidOrders += 1;
        bucket.revenue += o.totalAmount;

        const userAgentProducts = userAgentProductMap.get(o.userId) || new Set<string>();
        const hasMatchingAgentAction = o.items.some((item) => userAgentProducts.has(item.productId));
        if (hasMatchingAgentAction) {
          bucket.agentAssistedOrders += 1;
        } else {
          bucket.selfServiceOrders += 1;
        }
      }
    });

    const conversionOverTime = Array.from(timeSeriesMap.values()).map((bucket) => {
      const uniqueViewers = bucket.uniqueViewersSet.size;
      const dailyConvRate =
        uniqueViewers > 0
          ? Number(((bucket.paidOrders / uniqueViewers) * 100).toFixed(1))
          : 0;
      const dailyAbandonmentRate =
        bucket.cartsCreated > 0
          ? Number(((bucket.abandonedCarts / bucket.cartsCreated) * 100).toFixed(1))
          : 0;

      return {
        date: bucket.date,
        label: bucket.label,
        views: bucket.views,
        uniqueViewers,
        paidOrders: bucket.paidOrders,
        revenue: Number(bucket.revenue.toFixed(2)),
        conversionRate: dailyConvRate,
        cartAbandonmentRate: dailyAbandonmentRate,
        agentAssistedOrders: bucket.agentAssistedOrders,
        selfServiceOrders: bucket.selfServiceOrders,
      };
    });

    // ------------------------------------------------------------------------
    // SUMMARY OBJECT
    // ------------------------------------------------------------------------
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      role: req.user?.role,
      user: {
        id: req.user?.id,
        name: req.user?.name,
        email: req.user?.email,
      },
      dateRange: {
        range: rangeParam,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalDays: numDays,
      },
      headlineMetrics: {
        conversionRate: {
          value: conversionRate,
          paidOrders: paidOrdersCount,
          uniqueProductViewers: uniqueProductViewersCount,
          totalProductViews: productViews.length,
          definition: 'paid orders / unique users who viewed ≥1 product',
          formula: `${paidOrdersCount} paid orders / ${uniqueProductViewersCount} unique viewers = ${conversionRate}%`,
        },
        cartAbandonmentRate: {
          value: cartAbandonmentRate,
          abandonedCarts: abandonedCartsCount,
          convertedCarts: convertedCartsCount,
          totalCartsCreated,
          definition: 'carts with items that never became a paid order within 24h / total carts created',
          formula: `${abandonedCartsCount} abandoned carts / ${totalCartsCreated} total carts = ${cartAbandonmentRate}%`,
        },
        agentAssistedRatio: {
          agentAssistedOrders: agentAssistedOrdersCount,
          selfServiceOrders: selfServiceOrdersCount,
          totalPaidOrders,
          agentAssistedPercentage,
          selfServicePercentage,
          agentAssistedRevenue: Number(agentAssistedRevenue.toFixed(2)),
          selfServiceRevenue: Number(selfServiceRevenue.toFixed(2)),
          ratioFormatted: `${agentAssistedOrdersCount} : ${selfServiceOrdersCount}`,
          definition: "orders where purchased product appears in AgentAction ('add_to_cart' or 'recommend') for user vs no matching AgentAction",
        },
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders: allOrders.length,
        orderStatusBreakdown: {
          paid: paidOrdersCount,
          pending: pendingOrders.length,
          failed: failedOrders.length,
        },
        totalConversations: conversations.length,
        totalAgentActions: agentActions.length,
        totalUsers: users.length,
      },
      conversionOverTime,
      topRecommendations,
      recentClassifiedOrders: classifiedPaidOrders.slice(-10).reverse(),
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/conversations (also mounted at /api/admin/conversations)
 * Returns all AI conversation threads with messages, tool calls, and AgentAction logs
 */
adminRouter.get('/conversations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, limit = '50', page = '1' } = req.query;
    const pageSize = Math.min(Number(limit), 100);
    const currentPage = Math.max(Number(page), 1);
    const skip = (currentPage - 1) * pageSize;

    const where: any = {};
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
        { messages: { some: { content: { contains: q } } } },
      ];
    }

    const [totalCount, rawConversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          actions: {
            orderBy: { createdAt: 'asc' },
          },
        },
        take: pageSize,
        skip,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const conversations = rawConversations.map((conv) => {
      const parsedMessages = conv.messages.map((m) => {
        let parsedTools = null;
        if (m.toolCalls) {
          try {
            parsedTools = JSON.parse(m.toolCalls);
          } catch {
            parsedTools = m.toolCalls;
          }
        }
        return {
          ...m,
          toolCalls: parsedTools,
        };
      });

      const parsedActions = conv.actions.map((a) => {
        let parsedPayload = null;
        if (a.payload) {
          try {
            parsedPayload = JSON.parse(a.payload);
          } catch {
            parsedPayload = a.payload;
          }
        }
        return {
          ...a,
          payload: parsedPayload,
        };
      });

      // Extract summary of tools called
      const toolsCalled: string[] = [];
      parsedMessages.forEach((m) => {
        if (Array.isArray(m.toolCalls)) {
          m.toolCalls.forEach((tc: any) => {
            const toolName = tc.tool || tc.name;
            if (toolName && !toolsCalled.includes(toolName)) {
              toolsCalled.push(toolName);
            }
          });
        }
      });

      const firstUserMsg = parsedMessages.find((m) => m.role === 'user')?.content || 'New Session';
      const lastAgentMsg = [...parsedMessages].reverse().find((m) => m.role === 'agent')?.content || 'No response';

      return {
        id: conv.id,
        user: conv.user,
        messageCount: conv.messages.length,
        actionCount: conv.actions.length,
        toolsCalled,
        previewPrompt: firstUserMsg.length > 80 ? `${firstUserMsg.slice(0, 80)}...` : firstUserMsg,
        previewResponse: lastAgentMsg.length > 100 ? `${lastAgentMsg.slice(0, 100)}...` : lastAgentMsg,
        messages: parsedMessages,
        actions: parsedActions,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.json({
      success: true,
      totalCount,
      count: conversations.length,
      page: currentPage,
      totalPages: Math.ceil(totalCount / pageSize),
      data: conversations,
    });
  } catch (error: any) {
    console.error('Admin conversations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
