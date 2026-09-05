import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  Package,
  TrendingUp,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../types.js';
import { fetchProducts } from '../api.js';

interface PredictiveSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateToCatalog: () => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

const POPULAR_SUGGESTIONS = [
  'Electronics',
  'Fitness & Wellness',
  'Merino Apparel',
  'Noise Cancelling',
  'Ergonomic',
  'Bio-Impedance',
];

export const PredictiveSearchBar: React.FC<PredictiveSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSelectProduct,
  onNavigateToCatalog,
  placeholder = 'Search products by name, tag, or description...',
  compact = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<Product[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setPredictions([]);
      setTotalMatches(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchProducts({
          search: trimmed,
          limit: 6,
        });
        setPredictions(res.data || []);
        setTotalMatches(res.totalCount || 0);
        setSelectedIndex(-1);
      } catch {
        setPredictions([]);
        setTotalMatches(0);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close predictive dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (predictions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % predictions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (predictions.length > 0) {
        setSelectedIndex((prev) => (prev <= 0 ? predictions.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && predictions[selectedIndex]) {
        handleSelectProduct(predictions[selectedIndex]);
      } else {
        onNavigateToCatalog();
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    onSelectProduct?.(product);
    setIsOpen(false);
  };

  const handleQuickSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setSearchQuery('');
    setPredictions([]);
    setTotalMatches(0);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search
          className={`absolute left-3 text-neutral-400 pointer-events-none transition-colors ${
            isOpen ? 'text-sky-500' : ''
          } ${compact ? 'w-3.5 h-3.5 top-2.5' : 'w-4 h-4 top-2.5'}`}
        />

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full pl-9 ${
            hasQuery ? 'pr-16' : 'pr-4'
          } ${
            compact ? 'py-1.5 text-xs' : 'py-2 text-xs'
          } bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/80 focus:bg-white dark:focus:bg-neutral-800 transition-all shadow-2xs`}
        />

        {/* Right side controls: Loading spinner & Clear button */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
          )}

          {hasQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-neutral-200/80 dark:bg-neutral-700/80 rounded-md p-0.5 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Predictive Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in zoom-in-98 duration-150 backdrop-blur-md max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-neutral-50/90 dark:bg-neutral-950/60 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>
                {hasQuery ? 'Predictive Suggestions' : 'Trending Discoveries'}
              </span>
            </div>
            {hasQuery && totalMatches > 0 && (
              <span className="text-neutral-400 dark:text-neutral-500">
                {totalMatches} matching {totalMatches === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/70 max-h-84">
            {isLoading && predictions.length === 0 ? (
              /* Shimmer Loading Rows */
              <div className="p-2 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer w-3/4" />
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasQuery ? (
              predictions.length > 0 ? (
                /* Matching Products List */
                <div className="p-1.5 space-y-0.5">
                  {predictions.map((product, idx) => {
                    const isSelected = selectedIndex === idx;
                    const hasImgError = imageErrors[product.id];
                    const isLowStock = product.stock > 0 && product.stock <= 10;
                    const isOutOfStock = product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition text-left ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 shadow-2xs'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-150 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/50 dark:border-neutral-700/50 relative">
                          {product.imageUrl && !hasImgError ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setImageErrors((prev) => ({ ...prev, [product.id]: true }))
                              }
                            />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                              {product.name}
                            </h4>
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 shrink-0 font-mono">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>

                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {product.description}
                          </p>

                          {/* Badges */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                              <Tag className="w-2.5 h-2.5 text-neutral-400" />
                              {product.category}
                            </span>

                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Only {product.stock} left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct Jump Arrow */}
                        <div className="shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition pl-1">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No Results State */
                <div className="py-7 px-4 text-center">
                  <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    No products found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                    Try checking your spelling or search using keywords like &lsquo;audio&rsquo;, &lsquo;watch&rsquo;, or &lsquo;apparel&rsquo;.
                  </p>
                </div>
              )
            ) : (
              /* Empty input - Helpful Quick Suggestions */
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular Search Terms:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleQuickSuggestionClick(term)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-neutral-100 hover:bg-sky-50 hover:text-sky-600 dark:bg-neutral-800 dark:hover:bg-sky-950/40 dark:hover:text-sky-400 text-neutral-700 dark:text-neutral-300 transition cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950/80 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onNavigateToCatalog();
                setIsOpen(false);
              }}
              className="font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all in Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-400">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono">
                  ↑
                </kbd>{' '}
                <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono">
                  ↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono">
                  ↵
                </kbd>{' '}
                to select
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
