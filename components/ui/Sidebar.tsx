"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Filter,
  TrendingUp,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "スクリーニング", href: "/screener", icon: Filter },
  { name: "10倍株候補", href: "/screener?filter=tenbagger", icon: TrendingUp },
  { name: "市場分析", href: "/screener?filter=market", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-surface border-r border-surface-light">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-surface-light">
          <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center">
            <span className="text-background font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-gold font-bold text-lg">Buffett</h1>
            <p className="text-text-muted text-xs">Analyzer Pro</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-4 border-b border-surface-light">
          <SearchBar />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gold/10 text-gold border border-gold/30"
                    : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-light p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-light hover:text-text-primary transition-all"
          >
            <Settings className="h-5 w-5" />
            設定
          </Link>
          <div className="mt-4 px-3">
            <p className="text-xs text-text-muted">
              © 2024 Buffett Analyzer Pro
            </p>
            <p className="text-xs text-text-muted mt-1">
              Yahoo Finance API使用
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
