import { NextRequest, NextResponse } from "next/server";
import { analyzeStock, checkBuffettCriteria } from "@/lib/buffett-analysis";
import { ApiResponse, BuffettAnalysis } from "@/types/stock";

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: "Symbol is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeStock(symbol.toUpperCase());

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: `Analysis for ${symbol} not available`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const buffettCheck = checkBuffettCriteria(analysis);

    const response: ApiResponse<{
      analysis: BuffettAnalysis;
      buffettCriteria: typeof buffettCheck;
    }> = {
      success: true,
      data: {
        analysis,
        buffettCriteria: buffettCheck,
      },
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
