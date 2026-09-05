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
  ThumbsUp,
  MessageSquare,
  PenLine,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import { Product, SingleProductResponse, ProductReview, ProductReviewsResponse } from '../types.js';
import { fetchProductById, fetchProductReviews, submitProductReview, voteHelpfulReview } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

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
  const { user } = useAuth();
  const [productData, setProductData] = useState<SingleProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<ProductReviewsResponse | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // New review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessToast, setReviewSuccessToast] = useState(false);
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!productId) {
      setProductData(null);
      setReviewsData(null);
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

    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const res = await fetchProductReviews(productId);
        setReviewsData(res);
      } catch (err: any) {
        setReviewsError(err.message || 'Failed to load product reviews');
      } finally {
        setReviewsLoading(false);
      }
    };

    loadProduct();
    loadReviews();
  }, [productId]);

  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviews[reviewId] || !productId) return;
    try {
      const res = await voteHelpfulReview(productId, reviewId);
      setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
      setReviewsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount } : r
          ),
        };
      });
    } catch {
      // Graceful local update
      setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const authorName = reviewAuthor.trim() || user?.name || 'Verified Customer';
      const res = await submitProductReview(productId, {
        author: authorName,
        rating: reviewRating,
        title: reviewTitle.trim() || 'Customer Review',
        comment: reviewComment.trim(),
      });

      setReviewsData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          averageRating: res.averageRating,
          totalReviews: res.totalReviews,
          ratingBreakdown: res.ratingBreakdown,
          reviews: [res.review, ...prev.reviews],
        };
      });

      setReviewSuccessToast(true);
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setTimeout(() => setReviewSuccessToast(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, maxStars = 5, sizeClass = 'w-3.5 h-3.5') => {
    return (
      <div className="flex items-center text-amber-400 gap-0.5">
        {[1, 2, 3, 4, 5].slice(0, maxStars).map((star) => {
          const isFilled = rating >= star;
          const isHalf = !isFilled && rating >= star - 0.5;
          return (
            <Star
              key={star}
              className={`${sizeClass} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-400/60 text-amber-400'
                  : 'text-neutral-300 dark:text-neutral-700 fill-neutral-200 dark:fill-neutral-800'
              }`}
            />
          );
        })}
      </div>
    );
  };

  const formatReviewDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Verified purchase';
    }
  };

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
                      {/* Dynamic Star Rating Average */}
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('customer-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center text-amber-400 gap-1.5 text-xs hover:opacity-85 transition cursor-pointer"
                        title="Scroll to customer reviews"
                      >
                        {renderStars(reviewsData ? reviewsData.averageRating : 4.8, 5, 'w-3.5 h-3.5')}
                        <span className="ml-0.5 font-bold text-neutral-900 dark:text-neutral-100">
                          {reviewsData ? reviewsData.averageRating.toFixed(1) : '4.8'}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px] hover:underline">
                          ({reviewsData ? `${reviewsData.totalReviews} ${reviewsData.totalReviews === 1 ? 'review' : 'reviews'}` : 'Loading...'})
                        </span>
                      </button>
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

              {/* Customer Reviews & Star Rating Average Section */}
              <div
                id="customer-reviews-section"
                className="pt-8 border-t border-neutral-100 dark:border-neutral-800 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Customer Reviews & Ratings
                      </h3>
                      {reviewsData && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {reviewsData.averageRating.toFixed(1)} / 5.0
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Real feedback from verified purchasers
                    </p>
                  </div>

                  <button
                    id="write-review-toggle-btn"
                    type="button"
                    onClick={() => setShowReviewForm((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    <PenLine className="w-3.5 h-3.5 text-sky-500" />
                    <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                  </button>
                </div>

                {/* Rating Overview Card */}
                {reviewsData && (
                  <div className="p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Overall Score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 sm:border-r sm:border-neutral-200/60 sm:dark:border-neutral-800/60">
                      <div className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-mono">
                        {reviewsData.averageRating.toFixed(1)}
                      </div>
                      <div className="mt-1.5">
                        {renderStars(reviewsData.averageRating, 5, 'w-4 h-4')}
                      </div>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1">
                        Based on {reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        100% verified customer feedback
                      </span>
                    </div>

                    {/* Star Rating Breakdown Bars */}
                    <div className="md:col-span-8 space-y-1.5 px-1 sm:px-4">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewsData.ratingBreakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
                        const pct = reviewsData.totalReviews > 0
                          ? Math.round((count / reviewsData.totalReviews) * 100)
                          : 0;

                        return (
                          <div key={star} className="flex items-center gap-2.5 text-xs">
                            <div className="w-12 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1 shrink-0">
                              <span>{star}</span>
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            </div>

                            <div className="flex-1 h-2 bg-neutral-200/80 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="w-12 text-right text-[11px] text-neutral-400 font-mono shrink-0">
                              {count} ({pct}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submission Success Toast */}
                {reviewSuccessToast && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Thank you! Your product review has been submitted and published.</span>
                  </div>
                )}

                {/* Collapsible Write a Review Form */}
                {showReviewForm && (
                  <form
                    id="product-review-form"
                    onSubmit={handleSubmitReview}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-lg space-y-4 animate-in fade-in zoom-in-98 duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5 text-sky-500" />
                        Write Your Review for {product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Star Rating Picker */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Overall Rating <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (reviewHoverRating || reviewRating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                onMouseEnter={() => setReviewHoverRating(star)}
                                onMouseLeave={() => setReviewHoverRating(0)}
                                className="p-1 rounded-md hover:scale-110 transition cursor-pointer text-amber-400"
                                title={`${star} Star${star > 1 ? 's' : ''}`}
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-neutral-300 dark:text-neutral-600 fill-neutral-200 dark:fill-neutral-800'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1 font-mono">
                          {(reviewHoverRating || reviewRating)} / 5 (
                          {(reviewHoverRating || reviewRating) === 5
                            ? 'Excellent'
                            : (reviewHoverRating || reviewRating) === 4
                            ? 'Very Good'
                            : (reviewHoverRating || reviewRating) === 3
                            ? 'Average'
                            : (reviewHoverRating || reviewRating) === 2
                            ? 'Fair'
                            : 'Poor'}
                          )
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Reviewer Name */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder={user?.name || 'e.g., Alex Mercer'}
                          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* Review Headline */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Review Headline
                        </label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="e.g., Exceeded expectations, exceptional build!"
                          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Detailed Review Comments */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Detailed Review <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share details about what you liked, product performance, comfort, or value..."
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="submit-review-btn"
                        type="submit"
                        disabled={submittingReview || !reviewComment.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Customer Reviews */}
                <div className="space-y-3">
                  {reviewsLoading && !reviewsData ? (
                    /* Shimmer Skeleton Reviews */
                    <div className="space-y-3">
                      {[0, 1].map((n) => (
                        <div
                          key={n}
                          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 space-y-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 skeleton-shimmer" />
                            <div className="space-y-1">
                              <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer" />
                              <div className="h-2.5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer" />
                            </div>
                          </div>
                          <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer" />
                          <div className="h-2.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded skeleton-shimmer" />
                        </div>
                      ))}
                    </div>
                  ) : reviewsData && reviewsData.reviews.length > 0 ? (
                    reviewsData.reviews.map((rev) => {
                      const hasVoted = !!votedReviews[rev.id];

                      return (
                        <div
                          key={rev.id}
                          id={`review-${rev.id}`}
                          className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition shadow-2xs space-y-2.5"
                        >
                          {/* Header: Author, Badge, Date */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar Initial Circle */}
                              <div
                                className={`w-7 h-7 rounded-full ${
                                  rev.avatarColor || 'bg-indigo-600'
                                } text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0`}
                              >
                                {rev.author.charAt(0).toUpperCase()}
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                    {rev.author}
                                  </span>
                                  {rev.verifiedPurchase && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Verified Buyer
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">
                              {formatReviewDate(rev.createdAt)}
                            </span>
                          </div>

                          {/* Star Rating & Title */}
                          <div>
                            <div className="flex items-center gap-2">
                              {renderStars(rev.rating, 5, 'w-3 h-3')}
                              {rev.title && (
                                <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                  {rev.title}
                                </h5>
                              )}
                            </div>

                            {/* Comment */}
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mt-1.5">
                              {rev.comment}
                            </p>
                          </div>

                          {/* Bottom Action: Helpful Feedback */}
                          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                            <span>Was this review helpful?</span>
                            <button
                              type="button"
                              onClick={() => handleVoteHelpful(rev.id)}
                              disabled={hasVoted}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition cursor-pointer ${
                                hasVoted
                                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800'
                                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                              title={hasVoted ? 'Marked helpful' : 'Vote helpful'}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Helpful ({rev.helpfulCount})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Empty Reviews State */
                    <div className="py-8 px-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                      <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        No customer reviews yet
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
                        Be the first to share your experience with this item!
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition cursor-pointer"
                      >
                        <PenLine className="w-3 h-3" />
                        Write the First Review
                      </button>
                    </div>
                  )}
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
