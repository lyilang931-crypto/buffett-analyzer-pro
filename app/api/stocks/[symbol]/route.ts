import { NextRequest, NextResponse } from "next/server";
import { analyzeStock } from "@/lib/buffett-analysis";
import {
  getStockProfile,
  getFinancialMetrics,
  getPriceHistory,
  getExecutives,
  getCompetitors,
} from "@/lib/stock-api";
import { ApiResponse, StockDetail } from "@/types/stock";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();

    // 並列でデータ取得
    const [stock, metrics, analysis, priceHistory, executives, competitors] =
      await Promise.all([
        getStockProfile(symbol),
        getFinancialMetrics(symbol),
        analyzeStock(symbol),
        getPriceHistory(symbol, "1Y"),
        getExecutives(symbol),
        getCompetitors(symbol),
      ]);

    if (!stock || !metrics || !analysis) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Stock ${symbol} not found`,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 404 });
    }

    const detail: StockDetail = {
      stock,
      metrics,
      analysis,
      priceHistory,
      executives,
      competitors,
    };

    const response: ApiResponse<StockDetail> = {
      success: true,
      data: detail,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
