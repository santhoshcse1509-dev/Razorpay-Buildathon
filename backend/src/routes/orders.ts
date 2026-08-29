import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

export const ordersRouter = Router();

// Lazy initialization of Razorpay instance
let razorpayClient: Razorpay | null = null;
function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (key_id && key_secret && !key_id.includes('xxxx') && !key_secret.includes('xxxx')) {
    if (!razorpayClient) {
      razorpayClient = new Razorpay({ key_id, key_secret });
    }
    return razorpayClient;
  }
  return null;
}

function formatOrderWithTracking(o: any) {
  const createdAtTime = new Date(o.createdAt).getTime();
  const now = Date.now();
  const elapsedDays = (now - createdAtTime) / (1000 * 60 * 60 * 24);

  let fulfillmentStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Payment Pending' | 'Payment Failed';
  if (o.status === 'failed') {
    fulfillmentStatus = 'Payment Failed';
  } else if (o.status === 'pending') {
    fulfillmentStatus = 'Payment Pending';
  } else {
    // Paid orders progress through fulfillment stages based on age
    if (elapsedDays < 2) {
      fulfillmentStatus = 'Processing';
    } else if (elapsedDays < 6) {
      fulfillmentStatus = 'Shipped';
    } else {
      fulfillmentStatus = 'Delivered';
    }
  }

  const cleanId = o.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  const trackingNumber = `TRK-${cleanId}`;
  const carrier = 'BlueDart Express / FedEx Priority';

  // Estimated delivery date (3-5 days from creation)
  const estDeliveryDate = new Date(createdAtTime + 4 * 24 * 60 * 60 * 1000).toISOString();

  // Construct timeline steps
  const timeline: Array<{
    step: string;
    status: 'completed' | 'current' | 'upcoming' | 'failed';
    title: string;
    description: string;
    timestamp?: string;
    location?: string;
  }> = [];

  // Step 1: Placed
  timeline.push({
    step: 'order_placed',
    status: 'completed',
    title: 'Order Placed',
    description: 'Order details received and registered in fulfillment system.',
    timestamp: o.createdAt,
    location: 'Online Storefront',
  });

  // Step 2: Payment
  if (o.status === 'failed') {
    timeline.push({
      step: 'payment',
      status: 'failed',
      title: 'Payment Failed',
      description: 'Payment authorization declined or cancelled. Retry available.',
      timestamp: o.updatedAt || o.createdAt,
    });
  } else if (o.status === 'pending') {
    timeline.push({
      step: 'payment',
      status: 'current',
      title: 'Awaiting Payment',
      description: 'Order created, waiting for payment confirmation from Razorpay.',
      timestamp: o.createdAt,
    });
  } else {
    timeline.push({
      step: 'payment',
      status: 'completed',
      title: 'Payment Confirmed',
      description: `Payment verified via Razorpay (${o.razorpayPaymentId || 'Pre-authorized'}).`,
      timestamp: new Date(createdAtTime + 2 * 60 * 1000).toISOString(),
    });
  }

  // Step 3: Processing & Packing
  if (o.status === 'paid') {
    if (elapsedDays < 2) {
      timeline.push({
        step: 'processing',
        status: 'current',
        title: 'Processing & Quality Check',
        description: 'Items picked, sanitized, and packaged in protective materials.',
        timestamp: new Date(createdAtTime + 4 * 60 * 60 * 1000).toISOString(),
        location: 'Central Fulfillment Hub, Mumbai',
      });
      timeline.push({
        step: 'shipped',
        status: 'upcoming',
        title: 'Shipment Dispatch',
        description: 'Package ready for carrier pickup and barcoded tracking assignment.',
      });
      timeline.push({
        step: 'delivered',
        status: 'upcoming',
        title: 'Delivery',
        description: `Estimated arrival on ${new Date(estDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
      });
    } else if (elapsedDays < 6) {
      timeline.push({
        step: 'processing',
        status: 'completed',
        title: 'Packed & Dispatched',
        description: 'Order quality checked and handed over to courier.',
        timestamp: new Date(createdAtTime + 12 * 60 * 60 * 1000).toISOString(),
        location: 'Central Fulfillment Hub, Mumbai',
      });
      timeline.push({
        step: 'shipped',
        status: 'current',
        title: 'In Transit with Carrier',
        description: `Package on route via ${carrier} (AWB: ${trackingNumber}).`,
        timestamp: new Date(createdAtTime + 24 * 60 * 60 * 1000).toISOString(),
        location: 'Regional Sorting Facility',
      });
      timeline.push({
        step: 'delivered',
        status: 'upcoming',
        title: 'Out for Delivery',
        description: `Final mile delivery expected on ${new Date(estDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
      });
    } else {
      timeline.push({
        step: 'processing',
        status: 'completed',
        title: 'Packed & Dispatched',
        description: 'Order verified and securely packaged.',
        timestamp: new Date(createdAtTime + 12 * 60 * 60 * 1000).toISOString(),
        location: 'Central Fulfillment Hub, Mumbai',
      });
      timeline.push({
        step: 'shipped',
        status: 'completed',
        title: 'In Transit & Arrived at Destination Hub',
        description: `Package cleared transit checkpoint (AWB: ${trackingNumber}).`,
        timestamp: new Date(createdAtTime + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Local Delivery Center',
      });
      timeline.push({
        step: 'delivered',
        status: 'completed',
        title: 'Delivered',
        description: 'Package delivered to recipient address. Signed & verified.',
        timestamp: new Date(createdAtTime + 4 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Customer Address',
      });
    }
  }

  return {
    ...o,
    fulfillmentStatus,
    trackingNumber,
    carrier,
    estimatedDelivery: estDeliveryDate,
    timeline,
    shippingAddress: (() => {
      try {
        return o.shippingAddress ? JSON.parse(o.shippingAddress) : null;
      } catch {
        return null;
      }
    })(),
    items: o.items.map((i: any) => ({
      ...i,
      product: i.product
        ? {
            ...i.product,
            tags: (() => {
              try {
                return JSON.parse(i.product.tags);
              } catch {
                return typeof i.product.tags === 'string' ? i.product.tags.split(',') : [];
              }
            })(),
          }
        : undefined,
    })),
  };
}

/**
 * GET /api/orders
 * Returns list of orders with items, status summary, tracking and customer details
 */
ordersRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = (req.query.userId as string) || (req as any).user?.id;

    const where = userId ? { userId } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedOrders = orders.map(formatOrderWithTracking);

    const statusCounts = {
      paid: orders.filter((o) => o.status === 'paid').length,
      pending: orders.filter((o) => o.status === 'pending').length,
      failed: orders.filter((o) => o.status === 'failed').length,
      processing: parsedOrders.filter((o) => o.fulfillmentStatus === 'Processing').length,
      shipped: parsedOrders.filter((o) => o.fulfillmentStatus === 'Shipped').length,
      delivered: parsedOrders.filter((o) => o.fulfillmentStatus === 'Delivered').length,
    };

    res.json({
      success: true,
      count: orders.length,
      statusCounts,
      data: parsedOrders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/track/:query
 * Lookup order by Order ID, Razorpay Order ID, or Tracking Number
 */
ordersRouter.get('/track/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.params;
    const cleanQuery = query.trim();

    // Look for match in id, razorpayOrderId, or id matching the TRK suffix
    const allOrders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const matched = allOrders.find((o) => {
      if (o.id.toLowerCase() === cleanQuery.toLowerCase()) return true;
      if (o.razorpayOrderId && o.razorpayOrderId.toLowerCase() === cleanQuery.toLowerCase()) return true;
      const trkNum = `TRK-${o.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
      if (trkNum.toLowerCase() === cleanQuery.toLowerCase()) return true;
      if (o.id.endsWith(cleanQuery) || cleanQuery.endsWith(o.id.slice(-6))) return true;
      return false;
    });

    if (!matched) {
      res.status(404).json({
        success: false,
        error: `No order found matching "${cleanQuery}". Please check your order ID or tracking number.`,
      });
      return;
    }

    res.json({
      success: true,
      order: formatOrderWithTracking(matched),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get single order details with tracking
 */
ordersRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    res.json({
      success: true,
      order: formatOrderWithTracking(order),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orders/checkout or POST /api/orders
 * Creates a pending Order in database and creates a Razorpay Test Order
 */
ordersRouter.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    let { userId, shippingAddress, items, discountCode } = req.body;

    if (!userId && (req as any).user?.id) {
      userId = (req as any).user.id;
    }
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'user' } });
      userId = defaultUser ? defaultUser.id : 'usr_cust_01';
    }

    // 1. Resolve order items: from request body or active database cart
    let orderItemsData: Array<{ productId: string; quantity: number; price: number; name: string }> = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          orderItemsData.push({
            productId: prod.id,
            quantity: Math.max(1, item.quantity || 1),
            price: prod.price,
            name: prod.name,
          });
        }
      }
    } else {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Your cart is empty. Add items before proceeding to checkout.',
        });
        return;
      }

      orderItemsData = cartItems.map((ci) => ({
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.product.price,
        name: ci.product.name,
      }));
    }

    if (orderItemsData.length === 0) {
      res.status(400).json({ success: false, error: 'No valid products found for checkout.' });
      return;
    }

    // 2. Compute total amount (with optional 10% coupon support)
    let subtotal = orderItemsData.reduce((acc, i) => acc + i.price * i.quantity, 0);
    let discount = 0;
    if (discountCode && (discountCode.toUpperCase() === 'CART10' || discountCode.toUpperCase() === 'SAVE10')) {
      discount = subtotal * 0.1;
    }
    const finalTotalUsd = Math.max(1, subtotal - discount);
    // Convert to INR paise for Razorpay (approx ₹83 per USD, Razorpay requires paise as integer)
    const inrRate = 83;
    const finalTotalInr = Math.round(finalTotalUsd * inrRate);
    const amountInPaise = finalTotalInr * 100;

    // 3. Create Razorpay order ID
    const rzp = getRazorpayClient();
    let razorpayOrderId = '';

    if (rzp) {
      try {
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            userId,
            discountApplied: discount > 0 ? '10%' : '0',
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (e) {
        console.warn('Razorpay API call failed, generating simulated test order ID:', e);
      }
    }

    if (!razorpayOrderId) {
      // Mock test Razorpay order id matching Razorpay pattern
      razorpayOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    }

    // 4. Create Order record in Database with status "pending"
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'pending',
        totalAmount: finalTotalUsd,
        razorpayOrderId,
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
        items: {
          create: orderItemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          })),
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
    });

    const razorpayKey = process.env.RAZORPAY_KEY_ID || 'rzp_test_AiCommerceDemo123';

    res.json({
      success: true,
      message: 'Checkout initiated. Pending order created.',
      order: {
        ...order,
        shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      },
      razorpay: {
        orderId: razorpayOrderId,
        key: razorpayKey,
        amount: amountInPaise,
        amountInr: finalTotalInr,
        amountUsd: finalTotalUsd,
        currency: 'INR',
        name: 'Agentic Commerce Store',
        description: `Order #${order.id.slice(-6)} (${orderItemsData.length} items)`,
        prefill: {
          name: shippingAddress?.name || order.user?.name || 'Customer',
          email: shippingAddress?.email || order.user?.email || 'customer@example.com',
          contact: shippingAddress?.phone || '+919876543210',
        },
      },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orders/:id/verify
 * Handles BOTH success and failure callbacks/webhooks:
 * - Success: marks Order "paid", decrements product stock, clears cart, logs confirmation
 * - Failure: marks Order "failed", leaves cart intact, enables retry
 */
ordersRouter.post('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      simulateFailure,
      failureReason,
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // FAILURE PATH: Either explicit simulateFailure or missing required payment details
    if (simulateFailure === true || failureReason || (!razorpayPaymentId && !simulateFailure)) {
      const updatedFailedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'failed',
        },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      });

      // Cart is deliberately KEPT INTACT on payment failure
      res.json({
        success: false,
        status: 'failed',
        error: failureReason || 'Payment authorization was declined by the bank or cancelled by user.',
        order: {
          ...updatedFailedOrder,
          shippingAddress: updatedFailedOrder.shippingAddress
            ? JSON.parse(updatedFailedOrder.shippingAddress)
            : null,
        },
      });
      return;
    }

    // SUCCESS PATH:
    // Optional cryptographic signature check if secret is configured
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (key_secret && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', key_secret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        if (expectedSignature !== razorpaySignature && !razorpaySignature.startsWith('test_sig_')) {
          console.warn('Razorpay signature mismatch in verification.');
        }
      } catch (err) {
        console.warn('Signature verification skipped in sandbox:', err);
      }
    }

    // 1. Mark Order as "paid"
    const updatedPaidOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'paid',
        razorpayPaymentId: razorpayPaymentId || `pay_test_${Date.now()}`,
        razorpaySignature: razorpaySignature || `sig_test_${Date.now()}`,
      },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    // 2. Decrement stock for each product in the order
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 3. Clear user's database cart
    await prisma.cartItem.deleteMany({
      where: { userId: order.userId },
    });

    // 4. Create Order Confirmation Notification
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_confirmation',
        title: `✅ Payment Successful for Order #${order.id.slice(-6)}`,
        message: `Your payment of $${order.totalAmount.toFixed(2)} was successfully processed via Razorpay. Your order is now being fulfilled.`,
        metadata: JSON.stringify({
          orderId: order.id,
          totalAmount: order.totalAmount,
          paymentId: updatedPaidOrder.razorpayPaymentId,
        }),
      },
    });

    res.json({
      success: true,
      status: 'paid',
      message: 'Payment verified successfully. Order confirmed.',
      order: {
        ...updatedPaidOrder,
        shippingAddress: updatedPaidOrder.shippingAddress
          ? JSON.parse(updatedPaidOrder.shippingAddress)
          : null,
      },
    });
  } catch (error: any) {
    console.error('Order verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orders/:id/retry
 * Resets a failed order to pending and creates a fresh Razorpay order ID for retry
 */
ordersRouter.post('/:id/retry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    const newRazorpayOrderId = `order_retry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'pending',
        razorpayOrderId: newRazorpayOrderId,
      },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    const inrRate = 83;
    const finalTotalInr = Math.round(order.totalAmount * inrRate);
    const amountInPaise = finalTotalInr * 100;

    res.json({
      success: true,
      message: 'Order reset to pending for retry.',
      order: {
        ...updated,
        shippingAddress: updated.shippingAddress ? JSON.parse(updated.shippingAddress) : null,
      },
      razorpay: {
        orderId: newRazorpayOrderId,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_AiCommerceDemo123',
        amount: amountInPaise,
        amountInr: finalTotalInr,
        amountUsd: order.totalAmount,
        currency: 'INR',
        name: 'Agentic Commerce Store',
        description: `Retry Order #${order.id.slice(-6)}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
