"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Filter,
  TrendingUp,
  BarChart3,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "スクリーニング", href: "/screener", icon: Filter },
  { name: "10倍株候補", href: "/screener?filter=tenbagger", icon: TrendingUp },
  { name: "市場分析", href: "/screener?filter=market", icon: BarChart3 },
  { name: "BRK ポートフォリオ", href: "/portfolio", icon: Briefcase },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* モバイル用ハンバーガーボタン */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 bg-surface border border-surface-light rounded-lg shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5 text-gold" />
      </button>

      {/* モバイル用背景オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      )}

      {/* サイドバーパネル */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-surface border-r border-surface-light",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* ロゴ */}
          <div className="flex h-16 items-center gap-3 px-4 border-b border-surface-light">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-background font-bold text-base">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-gold font-bold text-base leading-tight">Moat</h1>
              <p className="text-text-muted text-xs">価値投資分析</p>
            </div>
            <button
              className="md:hidden p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-light"
              onClick={close}
              aria-label="メニューを閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 検索バー */}
          <div className="px-3 py-3 border-b border-surface-light">
            <SearchBar onSelect={close} />
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" &&
                  pathname.startsWith(item.href.split("?")[0]));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gold/10 text-gold border border-gold/30"
                      : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* フッター */}
          <div className="border-t border-surface-light p-4">
            <p className="text-xs text-text-muted px-3">© 2025 Moat</p>
            <p className="text-xs text-text-muted px-3 mt-0.5">Yahoo Finance API使用</p>
          </div>
        </div>
      </aside>
    </>
  );
}
