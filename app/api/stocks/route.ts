import { NextRequest, NextResponse } from "next/server";
import { screenStocks } from "@/lib/buffett-analysis";
import { ApiResponse, ScreeningResult, ScreeningCriteria } from "@/types/stock";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // クエリパラメータから条件を取得
    const criteria: ScreeningCriteria = {};

    const minROE = searchParams.get("minROE");
    if (minROE) criteria.minROE = Number(minROE);

    const maxPE = searchParams.get("maxPE");
    if (maxPE) criteria.maxPE = Number(maxPE);

    const maxPB = searchParams.get("maxPB");
    if (maxPB) criteria.maxPB = Number(maxPB);

    const minMoatScore = searchParams.get("minMoatScore");
    if (minMoatScore) criteria.minMoatScore = Number(minMoatScore);

    const minSafetyMargin = searchParams.get("minSafetyMargin");
    if (minSafetyMargin) criteria.minSafetyMargin = Number(minSafetyMargin);

    const result = await screenStocks(criteria);

    const response: ApiResponse<ScreeningResult> = {
      success: true,
      data: result,
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
