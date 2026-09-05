import React from 'react';
import { Package } from 'lucide-react';

interface ProductCardSkeletonProps {
  index?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ index = 0 }) => {
  // Vary widths based on index to create an organic, realistic preview rather than identical clones
  const titleWidths = ['w-[75%]', 'w-[60%]', 'w-[85%]', 'w-[70%]', 'w-[90%]', 'w-[65%]'];
  const desc2Widths = ['w-[65%]', 'w-[80%]', 'w-[55%]', 'w-[75%]', 'w-[60%]', 'w-[70%]'];
  const priceWidths = ['w-14', 'w-16', 'w-12', 'w-18', 'w-14', 'w-16'];

  const titleWidth = titleWidths[index % titleWidths.length];
  const desc2Width = desc2Widths[index % desc2Widths.length];
  const priceWidth = priceWidths[index % priceWidths.length];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-2xs">
      {/* Product Image Skeleton with Shimmer */}
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-150 dark:bg-neutral-950 flex items-center justify-center skeleton-shimmer">
        {/* Subtle Silhouette Icon */}
        <Package className="w-10 h-10 text-neutral-300/40 dark:text-neutral-800/60" />

        {/* Category Pill Skeleton (top-left) */}
        <div className="absolute top-3 left-3 h-5 w-20 rounded-full bg-white/70 dark:bg-neutral-800/80 backdrop-blur-xs border border-neutral-200/50 dark:border-neutral-700/50" />

        {/* Stock Badge Skeleton (top-right) */}
        <div className="absolute top-3 right-3 h-5 w-16 rounded-full bg-white/70 dark:bg-neutral-800/80 backdrop-blur-xs border border-neutral-200/50 dark:border-neutral-700/50" />
      </div>

      {/* Product Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title Skeleton */}
          <div className="h-4.5 rounded-md bg-neutral-200 dark:bg-neutral-800 mb-2 skeleton-shimmer" style={{ width: titleWidth.replace('w-[', '').replace(']', '') }} />

          {/* Description Lines Skeleton */}
          <div className="space-y-1.5 mb-3">
            <div className="h-3 w-full rounded bg-neutral-200/70 dark:bg-neutral-800/60 skeleton-shimmer" />
            <div className="h-3 rounded bg-neutral-200/70 dark:bg-neutral-800/60 skeleton-shimmer" style={{ width: desc2Width.replace('w-[', '').replace(']', '') }} />
          </div>

          {/* Tag Badges Skeleton */}
          <div className="flex items-center gap-1.5 mb-1">
            <div className="h-4 w-12 rounded bg-neutral-150 dark:bg-neutral-800/70 skeleton-shimmer" />
            <div className="h-4 w-14 rounded bg-neutral-150 dark:bg-neutral-800/70 skeleton-shimmer" />
            {index % 2 === 0 && (
              <div className="h-4 w-10 rounded bg-neutral-150 dark:bg-neutral-800/70 skeleton-shimmer" />
            )}
          </div>
        </div>

        {/* Footer Skeleton: Price & Action Buttons */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-7 rounded bg-neutral-200 dark:bg-neutral-800/60" />
            <div className={`h-5 ${priceWidth} rounded-md bg-neutral-300 dark:bg-neutral-700 skeleton-shimmer`} />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick view button skeleton */}
            <div className="w-8 h-8 rounded-xl bg-neutral-150 dark:bg-neutral-800 skeleton-shimmer" />
            {/* Add to cart button skeleton */}
            <div className="h-8 w-16 rounded-xl bg-sky-500/20 dark:bg-sky-500/15 border border-sky-500/20 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
