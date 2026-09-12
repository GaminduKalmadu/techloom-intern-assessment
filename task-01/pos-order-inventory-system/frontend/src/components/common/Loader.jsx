import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-blue-600`} />
    </div>
  );
};

export const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => {
  return (
    <div
      className={`bg-slate-200/80 rounded animate-pulse animate-shimmer ${width} ${height} ${className}`}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-5 bg-white rounded-2xl border border-slate-200/80 shadow-subtle ${className}`}>
      <div className="flex items-center justify-between">
        <SkeletonText width="w-28" height="h-4" />
        <div className="w-10 h-10 rounded-xl bg-slate-200/80 animate-pulse" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonText width="w-36" height="h-8" />
        <SkeletonText width="w-20" height="h-3" />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, className = '' }) => {
  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonText width="w-20" height="h-8" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-8 h-8 rounded-lg bg-slate-200/80 animate-pulse shrink-0" />
              <SkeletonText width="w-full" height="h-4" />
            </div>
            <SkeletonText width="w-24" height="h-4" />
            <SkeletonText width="w-20" height="h-6" />
            <SkeletonText width="w-16" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Spinner;
