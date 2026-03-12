"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  quoteType: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 検索実行
  useEffect(() => {
    const search = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.success) {
          setResults(data.data.slice(0, 8));
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // クリック外でクローズ
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToStock(results[selectedIndex].symbol);
      } else if (query.length > 0) {
        // 直接シンボルとして検索
        navigateToStock(query.toUpperCase());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigateToStock = (symbol: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/analyze/${symbol}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="銘柄検索（ティッカー or 会社名）"
          className="w-full pl-10 pr-10 py-2.5 bg-surface-light border border-surface-light rounded-lg text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold animate-spin" />
        )}
      </div>

      {/* 検索結果ドロップダウン */}
      {isOpen && (results.length > 0 || query.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-light rounded-lg shadow-lg overflow-hidden z-50">
          {results.length > 0 ? (
            <ul>
              {results.map((result, index) => (
                <li key={result.symbol}>
                  <button
                    onClick={() => navigateToStock(result.symbol)}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-gold/10 border-l-2 border-gold"
                        : "hover:bg-surface-light border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold">{result.symbol}</span>
                        <span className="text-xs text-text-muted">{result.exchange}</span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {result.longname || result.shortname}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length > 0 && !isLoading ? (
            <div className="px-4 py-6 text-center">
              <Building2 className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary">検索結果がありません</p>
              <button
                onClick={() => navigateToStock(query.toUpperCase())}
                className="mt-2 text-sm text-gold hover:text-gold-light"
              >
                「{query.toUpperCase()}」で直接分析
              </button>
            </div>
          ) : null}

          {/* クイック検索 */}
          {query.length === 0 && (
            <div className="p-3 border-t border-surface-light">
              <p className="text-xs text-text-muted mb-2">人気の銘柄</p>
              <div className="flex flex-wrap gap-2">
                {["AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "TSLA"].map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => navigateToStock(symbol)}
                    className="px-3 py-1 text-xs bg-surface-light text-text-secondary rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
