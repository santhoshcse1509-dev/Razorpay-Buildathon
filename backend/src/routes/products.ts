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
