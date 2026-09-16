import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export const MobileNavBar = ({
  items = [],
  activeKey,
  onSelect,
  onOpenMore,
  moreBadgeCount = 0,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden apple-glass border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),10px)] shadow-lg shadow-black/5 dark:shadow-black/40 backdrop-blur-xl"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              type="button"
              className={`
                flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl
                transition-all duration-150 ease-out active:scale-95 select-none relative
                ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active top glow pill */}
              {isActive && (
                <span
                  className="absolute -top-1.5 w-6 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm shadow-indigo-500/50"
                  aria-hidden="true"
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-xs font-bold font-mono flex items-center justify-center ring-2 ring-white dark:ring-[#0c101c]">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-xs font-grotesk tracking-tight mt-1 leading-none line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* ─── 'More' Trigger for Secondary Drawer ─── */}
        <button
          onClick={onOpenMore}
          type="button"
          aria-label="Open menu options"
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-150 ease-out active:scale-95 select-none relative"
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {moreBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#0c101c]" />
            )}
          </div>
          <span className="text-xs font-grotesk tracking-tight mt-1 leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNavBar;
