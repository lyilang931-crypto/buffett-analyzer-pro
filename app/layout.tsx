import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Buffett Analyzer Pro | 10倍株を発掘",
  description: "バフェット流投資分析で全世界の株式から10倍株候補を発掘",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-text-primary`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          {/* モバイル: サイドバーなし・ハンバーガー分の上部余白 */}
          {/* デスクトップ: ml-64 でサイドバー分シフト */}
          <main className="flex-1 md:ml-64 min-w-0 flex flex-col">
            <div className="flex-1 pt-14 md:pt-0 px-4 md:px-6 py-4 md:py-6">
              {children}
            </div>
            {/* グローバルフッター（全ページ共通） */}
            <footer className="mt-6 px-4 md:px-6 pb-6 border-t border-surface-light pt-4">
              <p className="text-xs text-text-muted leading-relaxed">
                ⚠️ <strong className="text-text-secondary">免責事項:</strong>{" "}
                本サービスは教育目的のみです。投資判断は自己責任でお願いします。
                当サービスはWarren Buffett氏とは一切関係ありません。
                掲載情報は情報提供を目的としており、投資助言ではありません。
                過去のパフォーマンスは将来の結果を保証しません。
              </p>
              <p className="text-xs text-text-muted mt-1">
                © 2025 Buffett Analyzer Pro · データ提供: Yahoo Finance · 教育目的のみ
              </p>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
