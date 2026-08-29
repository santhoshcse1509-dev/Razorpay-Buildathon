import React, { useState, useEffect } from 'react';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Check,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Tag,
  DollarSign,
} from 'lucide-react';
import { Product, CategoryInfo, ProductFilters } from '../types.js';
import { fetchProducts, fetchCategories } from '../api.js';
import { ProductCard } from './ProductCard.js';

interface ProductCatalogProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onSelectProduct,
  onAddToCart,
  searchQuery,
  setSearchQuery,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<ProductFilters['sortBy']>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        setCategories(res.categories || []);
      } catch {
        // Handled silently for production
      }
    };
    loadCategories();
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    const loadFilteredProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: ProductFilters = {
          category: selectedCategory,
          search: searchQuery,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy,
          inStockOnly,
          limit: 50,
        };

        const res = await fetchProducts(filters);
        setProducts(res.data || []);
        setTotalCount(res.totalCount ?? res.data.length);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      loadFilteredProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, inStockOnly]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setInStockOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim().length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    inStockOnly ||
    sortBy !== 'newest';

  return (
    <div id="product-catalog-section" className="space-y-6">
      {/* Hero / Banner Showcase */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-indigo-950 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Curated Commerce Catalog • Premium Collection
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Discover Premium Gear &amp; Curated Lifestyle Goods
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
            Explore cutting-edge electronics, merino apparel, artisanal home essentials, and performance fitness equipment — backed by real-time inventory and instant fulfillment.
          </p>

          {/* Quick Category Jump Chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Catalog Section: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-6 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
              Filter Catalog
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2">
              Categories
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'All'
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] opacity-70 font-mono">
                  {categories.reduce((acc, c) => acc + c.count, 0) || 30}
                </span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat.name
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2">
              Price Range ($)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Min ($)</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Max ($)</span>
                <input
                  type="number"
                  placeholder="1000"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Availability Filter */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2">
              Availability
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-neutral-300 focus:ring-sky-500 cursor-pointer"
              />
              <span>In Stock Only (stock &gt; 0)</span>
            </label>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Bar: Search feedback, sort dropdown & mobile filter trigger */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-sky-500" />
                Filters
              </button>

              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Showing{' '}
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {products.length}
                </span>{' '}
                of {totalCount} products
                {selectedCategory !== 'All' && (
                  <span className="ml-1 text-sky-600 dark:text-sky-400 font-medium">
                    in {selectedCategory}
                  </span>
                )}
                {searchQuery && (
                  <span className="ml-1 text-neutral-400">
                    matching &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium hidden sm:inline flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="stock_desc">Highest Stock</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter Drawer / Dropdown */}
          {mobileFilterOpen && (
            <div className="lg:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Filter Options
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-sky-500 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-sky-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        selectedCategory === c.name
                          ? 'bg-sky-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Price ($)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Price ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                />
              </div>

              {/* In stock toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          )}

          {/* Product Grid Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3 animate-pulse"
                >
                  <div className="aspect-4/3 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-16" />
                    <div className="h-7 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs text-center space-y-2">
              <p className="font-semibold">Failed to load product catalog</p>
              <p>{error}</p>
              <button
                onClick={() => handleResetFilters()}
                className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                No products match your criteria
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Try adjusting your category filter, clearing your search query, or broadening your price range.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
