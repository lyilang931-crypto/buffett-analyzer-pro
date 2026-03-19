import { NextResponse } from 'next/server';
import { getBerkshirePortfolio } from '@/lib/sec-13f';

export async function GET() {
  try {
    const portfolio = await getBerkshirePortfolio();
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Berkshire portfolio fetch error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
