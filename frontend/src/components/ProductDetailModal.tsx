import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingCart,
  CheckCircle2,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Tag,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Product, SingleProductResponse } from '../types.js';
import { fetchProductById } from '../api.js';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onAskAi?: (query: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
  onSelectProduct,
  onAddToCart,
  onAskAi,
}) => {
  const [productData, setProductData] = useState<SingleProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProductData(null);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      setQuantity(1);
      try {
        const res = await fetchProductById(productId);
        setProductData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (!productId) return null;

  const product = productData?.data;
  const relatedProducts = productData?.relatedProducts || [];

  const handleAddToCart = () => {
    if (!product) return;
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Electronics':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'Apparel':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Home & Living':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Fitness & Wellness':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="product-detail-modal"
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <button
              onClick={onClose}
              className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Catalog
            </button>
            {product && (
              <>
                <span>/</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {product.category}
                </span>
                <span>/</span>
                <span className="truncate max-w-[200px] text-neutral-900 dark:text-neutral-100 font-semibold">
                  {product.name}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-xs text-neutral-400">Loading product details from database...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs text-center">
              {error}
            </div>
          ) : product ? (
            <>
              {/* Product Hero Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left: Product Image */}
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                      <Package className="w-16 h-16 mb-2 text-neutral-500/40" />
                      <span className="font-mono text-xs">{product.category}</span>
                    </div>
                  )}

                  <span
                    className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${getCategoryColor(
                      product.category
                    )}`}
                  >
                    {product.category}
                  </span>
                </div>

                {/* Right: Product Details & Purchase Actions */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {/* Star Rating Simulation */}
                      <div className="flex items-center text-amber-400 gap-0.5 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400/30" />
                        <span className="ml-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                          4.8
                        </span>
                        <span className="text-neutral-400 text-[11px]">(42 reviews)</span>
                      </div>
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                      {product.name}
                    </h1>

                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-400">Tax included</span>
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div>
                    {product.stock > 10 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock ({product.stock} units available)
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Low Stock — Only {product.stock} left in inventory!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Currently Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Product Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Cart Actions */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || product.stock === 0}
                          className="px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold font-mono text-neutral-900 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock || product.stock === 0}
                          className="px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                    {/* Add to Cart & Ask AI Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add {quantity > 1 ? `(${quantity})` : ''} to Cart • ${(
                          product.price * quantity
                        ).toFixed(2)}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onAskAi && product) {
                            onAskAi(`Tell me more about "${product.name}", its best use cases, and how it compares to similar items in ${product.category}.`);
                            onClose();
                          }
                        }}
                        className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700"
                        title="Ask AI Shopping Assistant about this item"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        <span>Ask AI</span>
                      </button>
                    </div>
                    </div>

                    {addedToast && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <CheckCircle2 className="w-4 h-4" />
                        Added {quantity}x &ldquo;{product.name}&rdquo; to your shopping cart!
                      </div>
                    )}
                  </div>

                  {/* Value Props / Assurance */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>Free Express Shipping</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>2-Year Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>30-Day Returns</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products in same category */}
              {relatedProducts.length > 0 && (
                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Related {product.category} Products
                    </h3>
                    <span className="text-xs text-neutral-400">
                      Customers also viewed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedProducts.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectProduct(rel)}
                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500/50 rounded-xl p-3 cursor-pointer transition group flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-4/3 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 mb-2">
                            {rel.imageUrl ? (
                              <img
                                src={rel.imageUrl}
                                alt={rel.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-sky-500 transition">
                            {rel.name}
                          </h4>
                          <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                            {rel.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            ${rel.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium group-hover:underline">
                            View &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
