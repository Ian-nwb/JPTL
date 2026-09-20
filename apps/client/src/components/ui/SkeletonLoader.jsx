import React from 'react';

/**
 * Basic pulsing/shimmering Skeleton bar with custom height, width, and rounded corners
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-xl ${className}`}
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
 * Complete Landlord Dashboard Loading Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Broadcast banner skeleton */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <CardSkeleton count={4} />

      {/* Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TableSkeleton rows={4} cols={3} />
        </div>
        <div>
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Tenant Portal Loading Skeleton
 */
export function TenantPortalSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Hero Resident Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1322]/70 backdrop-blur-md shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 w-full md:w-2/3">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Skeleton className="h-11 w-32 rounded-2xl" />
          <Skeleton className="h-11 w-32 rounded-2xl" />
        </div>
      </div>

      {/* 3 Widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1322]/70 backdrop-blur-md space-y-4 h-48 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={3} cols={3} />
        </div>
        <div>
          <TableSkeleton rows={3} cols={2} />
        </div>
      </div>
    </div>
  );
}
