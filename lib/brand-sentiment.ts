// ブランド・センチメント分析サービス（Gemini API専用）
// 失敗した場合は null を返す → UI側でセクション非表示

export interface BrandSentiment {
  score: number;                        // 0-100 センチメントスコア
  trend: "上昇" | "安定" | "下降";     // ブランドトレンド
  source: "Gemini";                     // データソース（Gemini固定）
  positiveRatio: number;                // ポジティブ比率 0-100
  negativeRatio: number;                // ネガティブ比率 0-100
}

const GEMINI_MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 8000;

export async function getBrandSentiment(
  nameOrSymbol: string,
  symbol: string
): Promise<BrandSentiment | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[BrandSentiment] GEMINI_API_KEY not set — skipping sentiment");
    return null;
  }

  const prompt = `You are a brand analyst. Assess customer sentiment for ${nameOrSymbol} (ticker: ${symbol}).

Respond with ONLY this JSON (no markdown, no extra text):
{"sentimentScore":75,"trend":"rising","positiveRatio":70,"negativeRatio":15}

Rules:
- sentimentScore: 0–100 integer (0=hated, 50=neutral, 100=beloved)
- trend: exactly one of "rising" | "stable" | "declining"
- positiveRatio: 0–100 integer
- negativeRatio: 0–100 integer`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 128 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[BrandSentiment] Gemini HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.warn("[BrandSentiment] Gemini returned no text. data:", JSON.stringify(data).slice(0, 300));
      return null;
    }

    // JSONブロックを抽出してパース
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn("[BrandSentiment] No JSON in response:", raw.slice(0, 200));
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const trendMap: Record<string, "上昇" | "安定" | "下降"> = {
      rising: "上昇",
      stable: "安定",
      declining: "下降",
    };

    const score = parsed.sentimentScore != null
      ? Math.min(100, Math.max(0, Number(parsed.sentimentScore)))
      : null;
    if (score === null || isNaN(score)) {
      console.warn("[BrandSentiment] Invalid sentimentScore:", parsed.sentimentScore);
      return null;
    }

    const positiveRatio = Math.min(100, Math.max(0, Number(parsed.positiveRatio) || 0));
    const negativeRatio = Math.min(100, Math.max(0, Number(parsed.negativeRatio) || 0));

    console.log(`[BrandSentiment] OK — score:${score} trend:${parsed.trend} +${positiveRatio}% -${negativeRatio}%`);

    return {
      score,
      trend: trendMap[parsed.trend] ?? "安定",
      source: "Gemini",
      positiveRatio,
      negativeRatio,
    };
  } catch (e) {
    console.error("[BrandSentiment] Exception:", e instanceof Error ? e.message : e);
    return null;
  }
}
