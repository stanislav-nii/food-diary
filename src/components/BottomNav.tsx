"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
      <div className="max-w-layout-max-width mx-auto h-16 flex items-center justify-around px-space-base">
        <Link
          href="/"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
            isActive("/") ? "text-primary-container scale-105" : "text-outline hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">grid_view</span>
        </Link>
        <Link
          href="/search"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
            isActive("/search") ? "text-primary-container scale-105" : "text-outline hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
        </Link>
        <Link
          href="/settings"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
            isActive("/settings") ? "text-primary-container scale-105" : "text-outline hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">tune</span>
        </Link>
      </div>
    </nav>
  );
}