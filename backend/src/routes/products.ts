import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const productsRouter = Router();

function parseProductTags(p: any) {
  let tags: string[] = [];
  try {
    tags = JSON.parse(p.tags);
  } catch {
    tags = typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : [];
  }
  return {
    ...p,
    tags,
  };
}

// GET /api/products - list products with category, price range, search & sorting
productsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, minPrice, maxPrice, sortBy, search, inStockOnly, limit, page } = req.query;

    const where: any = {};

    // Category filtering
    if (category && typeof category === 'string' && category !== 'All' && category !== 'all') {
      where.category = category;
    }

    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        where.price.gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        where.price.lte = Number(maxPrice);
      }
    }

    // Stock availability filter
    if (inStockOnly === 'true' || inStockOnly === '1') {
      where.stock = { gt: 0 };
    }

    // Plain text search match across name, description, and tags
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'name_desc') {
      orderBy = { name: 'desc' };
    } else if (sortBy === 'stock_desc') {
      orderBy = { stock: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const pageSize = limit ? Math.min(Number(limit), 100) : 50;
    const currentPage = page ? Math.max(Number(page), 1) : 1;
    const skip = (currentPage - 1) * pageSize;

    const [totalCount, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take: pageSize,
        skip,
        orderBy,
      }),
    ]);

    const products = rawProducts.map(parseProductTags);

    res.json({
      success: true,
      totalCount,
      count: products.length,
      page: currentPage,
      totalPages: Math.ceil(totalCount / pageSize),
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/categories - get all categories with count & price ranges
productsRouter.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      select: { category: true, price: true, stock: true },
    });

    const categoryMap: Record<string, { count: number; minPrice: number; maxPrice: number; totalStock: number }> = {};
    
    products.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = {
          count: 0,
          minPrice: p.price,
          maxPrice: p.price,
          totalStock: 0,
        };
      }
      const item = categoryMap[p.category];
      item.count += 1;
      item.totalStock += p.stock;
      if (p.price < item.minPrice) item.minPrice = p.price;
      if (p.price > item.maxPrice) item.maxPrice = p.price;
    });

    const categories = Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      count: stats.count,
      minPrice: stats.minPrice,
      maxPrice: stats.maxPrice,
      totalStock: stats.totalStock,
    }));

    res.json({
      success: true,
      totalProducts: products.length,
      categories,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:id - get single product by ID with related products
productsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req.query.userId as string) || null;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found.`,
      });
      return;
    }

    // Record product view asynchronously
    prisma.productView.create({
      data: {
        productId: product.id,
        userId: userId || undefined,
      },
    }).catch(() => {});

    // Fetch up to 4 related products in the same category
    const relatedRaw = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const parsedProduct = parseProductTags(product);
    const relatedProducts = relatedRaw.map(parseProductTags);

    res.json({
      success: true,
      data: parsedProduct,
      relatedProducts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:id/view - explicitly log product view with optional userId
productsRouter.post('/:id/view', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body?.userId || (req as any).user?.id || null;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const view = await prisma.productView.create({
      data: {
        productId: id,
        userId: userId || undefined,
      },
    });

    res.json({ success: true, viewId: view.id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// PRODUCT REVIEWS API
// ---------------------------------------------------------------------------

interface ProductReview {
  id: string;
  productId: string;
  author: string;
  avatarColor?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

const reviewsStore = new Map<string, ProductReview[]>();

function generateSeedReviews(productId: string, productName: string, category: string): ProductReview[] {
  const catReviews: Record<string, Array<{ author: string; rating: number; title: string; comment: string; daysAgo: number; helpful: number }>> = {
    'Electronics': [
      {
        author: 'David K.',
        rating: 5,
        title: 'Superb fidelity and outstanding battery longevity',
        comment: `The performance of ${productName} exceeded my expectations. Crisp audio/display response and the build quality feels truly top-tier.`,
        daysAgo: 3,
        helpful: 19,
      },
      {
        author: 'Samantha W.',
        rating: 5,
        title: 'Seamless connectivity and elegant industrial design',
        comment: `Pairs instantly with all my gear. The matte finish and tactile feedback are wonderful for daily work and travel.`,
        daysAgo: 11,
        helpful: 12,
      },
      {
        author: 'Michael T.',
        rating: 4,
        title: 'Great overall performance, highly recommended',
        comment: `Very reliable hardware with fast response. Minor learning curve on some controls, but once configured it works flawlessly.`,
        daysAgo: 24,
        helpful: 7,
      },
    ],
    'Fitness & Wellness': [
      {
        author: 'Dr. Rachel Green',
        rating: 5,
        title: 'Noticeable difference in daily recovery and mobility',
        comment: `As someone who trains 5 days a week, ${productName} has become an essential part of my evening routine. High grade materials and genuinely effective.`,
        daysAgo: 4,
        helpful: 26,
      },
      {
        author: 'Jordan Hayes',
        rating: 5,
        title: 'Sturdy, comfortable, and well engineered',
        comment: `Exactly what I needed for my home wellness setup. You can feel the ergonomic thought that went into the construction.`,
        daysAgo: 14,
        helpful: 14,
      },
      {
        author: 'Chloe Simmons',
        rating: 4,
        title: 'Very happy with this purchase',
        comment: `Easy to clean, durable construction, and performs just as advertised. Will likely buy another as a gift.`,
        daysAgo: 28,
        helpful: 8,
      },
    ],
    'Apparel': [
      {
        author: 'Alex Morgan',
        rating: 5,
        title: 'Unbelievably soft and true to size',
        comment: `The fabric drape and breathability of ${productName} are remarkable. Retains its shape and texture even after repeated wash cycles.`,
        daysAgo: 5,
        helpful: 17,
      },
      {
        author: 'Oliver Bennett',
        rating: 5,
        title: 'Versatile staple for everyday wear',
        comment: `Clean tailoring and premium stitch density. Works equally well for casual outings or layering during commutes.`,
        daysAgo: 16,
        helpful: 9,
      },
      {
        author: 'Emma Watson',
        rating: 4,
        title: 'Great quality and modern cut',
        comment: `Very comfortable feel against the skin. Sizing was spot on according to the measurement guide.`,
        daysAgo: 32,
        helpful: 6,
      },
    ],
    'Home & Living': [
      {
        author: 'Lucas Vance',
        rating: 5,
        title: 'Elevated the aesthetic of our living space',
        comment: `Minimalist styling combined with quiet, reliable performance. Beautifully packaged and super straightforward to operate.`,
        daysAgo: 6,
        helpful: 22,
      },
      {
        author: 'Hannah Brooks',
        rating: 5,
        title: 'High quality materials that feel built to last',
        comment: `So much better than standard commercial alternatives. The craftsmanship is evident from the moment you unbox it.`,
        daysAgo: 19,
        helpful: 13,
      },
      {
        author: 'Ethan Clark',
        rating: 4,
        title: 'Solid design, very satisfied',
        comment: `Does exactly what it promises without unnecessary gimmicks. Looks great on the counter or shelf.`,
        daysAgo: 34,
        helpful: 5,
      },
    ],
  };

  const pool = catReviews[category] || catReviews['Electronics'];
  const colors = ['bg-indigo-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];

  return pool.map((item, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - item.daysAgo);
    return {
      id: `rev_${productId}_${idx + 1}`,
      productId,
      author: item.author,
      avatarColor: colors[idx % colors.length],
      rating: item.rating,
      title: item.title,
      comment: item.comment,
      verifiedPurchase: true,
      helpfulCount: item.helpful,
      createdAt: d.toISOString(),
    };
  });
}

function getProductReviews(productId: string, product: { name: string; category: string }): ProductReview[] {
  if (!reviewsStore.has(productId)) {
    const seed = generateSeedReviews(productId, product.name, product.category);
    reviewsStore.set(productId, seed);
  }
  return reviewsStore.get(productId) || [];
}

function computeReviewStats(reviews: ProductReview[]) {
  const total = reviews.length;
  if (total === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / total) * 10) / 10;
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    breakdown[star] = (breakdown[star] || 0) + 1;
  });
  return {
    averageRating: avg,
    totalReviews: total,
    ratingBreakdown: breakdown,
  };
}

// GET /api/products/:id/reviews - get reviews and rating stats
productsRouter.get('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, error: `Product with ID '${id}' not found.` });
      return;
    }

    const reviews = getProductReviews(product.id, { name: product.name, category: product.category });
    const stats = computeReviewStats(reviews);

    res.json({
      success: true,
      productId: product.id,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
      reviews,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:id/reviews - submit a new review
productsRouter.post('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { author, rating, title, comment } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, error: `Product with ID '${id}' not found.` });
      return;
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const reviewerName = (author && typeof author === 'string' && author.trim().length > 0)
      ? author.trim()
      : 'Verified Customer';

    const newReview: ProductReview = {
      id: `rev_${id}_${Date.now()}`,
      productId: id,
      author: reviewerName,
      avatarColor: 'bg-sky-600',
      rating: numericRating,
      title: title?.trim() || 'Verified Customer Review',
      comment: comment?.trim() || 'Great product, thoroughly pleased with the quality and delivery!',
      verifiedPurchase: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    };

    const currentReviews = getProductReviews(product.id, { name: product.name, category: product.category });
    currentReviews.unshift(newReview);
    reviewsStore.set(id, currentReviews);

    const stats = computeReviewStats(currentReviews);

    res.status(201).json({
      success: true,
      review: newReview,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:id/reviews/:reviewId/helpful - mark a review helpful
productsRouter.post('/:id/reviews/:reviewId/helpful', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, reviewId } = req.params;
    const currentReviews = reviewsStore.get(id) || [];
    const target = currentReviews.find((r) => r.id === reviewId);
    if (!target) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }

    target.helpfulCount = (target.helpfulCount || 0) + 1;
    res.json({ success: true, helpfulCount: target.helpfulCount });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
