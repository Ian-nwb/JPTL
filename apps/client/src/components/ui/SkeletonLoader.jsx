import React from 'react';

/**
 * Basic pulsing Skeleton bar with custom height, width, and rounded corners
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/70 rounded-lg ${className}`}
      style={style}
    />
  );
}

/**
 * Modern Card Skeleton Loader for Dashboard metric KPI cards
 */
export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1322]/70 backdrop-blur-md shadow-xs flex flex-col justify-between h-32"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton Loader for data lists (Tenant directory, tickets, rent roll, payments)
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-[#0E1322]/80 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            {Array.from({ length: cols - 1 }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-4 w-20 hidden md:block" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Dashboard Loading Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <CardSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={4} cols={4} />
        </div>
        <div>
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    </div>
  );
}
