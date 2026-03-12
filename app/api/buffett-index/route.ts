import { NextResponse } from "next/server";
import { getBuffettIndex } from "@/lib/stock-api";
import { ApiResponse, BuffettIndex } from "@/types/stock";

export async function GET() {
  try {
    const index = await getBuffettIndex();

    const response: ApiResponse<BuffettIndex> = {
      success: true,
      data: index,
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
