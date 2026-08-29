import React from 'react';
import { ShoppingCart, Eye, Package, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../types.js';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
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

  const getCategoryGradient = (cat: string) => {
    switch (cat) {
      case 'Electronics':
        return 'from-sky-500/20 via-sky-600/10 to-indigo-500/20';
      case 'Apparel':
        return 'from-purple-500/20 via-indigo-600/10 to-pink-500/20';
      case 'Home & Living':
        return 'from-amber-500/20 via-orange-600/10 to-yellow-500/20';
      case 'Fitness & Wellness':
        return 'from-emerald-500/20 via-teal-600/10 to-cyan-500/20';
      default:
        return 'from-neutral-500/20 via-neutral-600/10 to-neutral-700/20';
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      {/* Product Image / Visual Showcase */}
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to stylized abstract background if image fails
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback Graphic Box */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${getCategoryGradient(
            product.category
          )} flex flex-col items-center justify-center p-4 -z-1`}
        >
          <Package className="w-10 h-10 text-neutral-400/40 mb-1" />
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            {product.category}
          </span>
        </div>

        {/* Category Pill */}
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${getCategoryColor(
            product.category
          )}`}
        >
          {product.category}
        </span>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white shadow-2xs backdrop-blur-xs">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white shadow-2xs backdrop-blur-xs">
            Only {product.stock} left
          </span>
        ) : (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900/70 dark:bg-neutral-800/80 text-white backdrop-blur-xs">
            {product.stock} in stock
          </span>
        )}

        {/* Quick View Button overlay on hover */}
        <div className="absolute inset-0 bg-neutral-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onSelect(product)}
            className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold shadow-lg hover:scale-105 transition cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-sky-500" />
            Quick View
          </button>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name */}
          <h3
            onClick={() => onSelect(product)}
            className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer line-clamp-1 mb-1"
          >
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono"
                >
                  #{tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-[10px] text-neutral-400 self-center">
                  +{product.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Price & Action Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">
              Price
            </span>
            <span className="text-base font-bold text-neutral-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelect(product)}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition cursor-pointer"
              title="View Product Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                disabled={isOutOfStock}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
