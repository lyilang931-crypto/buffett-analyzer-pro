import { YahooQuote, YahooFinancials } from "./yahoo-finance";
import { getCEOScore } from "./ceo-reputation";

// バフェット7原則の評価結果
export interface BuffettPrincipleScore {
  name: string;
  nameEn: string;
  description: string;
  score: number; // 0-100
  passed: boolean;
  details: string;
  weight: number;
}

export interface Buffett7PrinciplesResult {
  principles: BuffettPrincipleScore[];
  totalScore: number;
  signal: "BUY" | "HOLD" | "PASS";
  signalStrength: number; // 0-100
  tenBaggerProbability: number; // 0-100
  summary: string;
}

// ============================================================
// バフェット7原則の評価（正式版）
// 1. 理解できるビジネス（能力の輪）
// 2. 経済的な堀（Economic Moat）
// 3. 安全マージン（内在価値より安く買う）
// 4. 長期保有の耐久性（収益の一貫性）
// 5. 優れた経営者への信頼
// 6. Mr.マーケットの活用（グレアムの教え）
// 7. 顧客に愛されているか（ブランド力）
// ============================================================
export function evaluateBuffett7Principles(
  quote: YahooQuote,
  financials: YahooFinancials,
  roeHistory: Array<{ year: number; roe: number }>,
  intrinsicValue?: number
): Buffett7PrinciplesResult {
  const principles: BuffettPrincipleScore[] = [];
  const currentPrice = quote.regularMarketPrice ?? 0;

  // ----------------------------------------------------------
  // 1. 理解できるビジネス（能力の輪）
  // セクター・業種が明確で、ビジネスモデルが理解しやすいか
  // ----------------------------------------------------------
  const hasSector = !!(quote.sector && quote.industry);
  const understandableScore = hasSector ? 80 : 40;
  principles.push({
    name: "理解できるビジネス",
    nameEn: "Circle of Competence",
    description: "事業内容が明確で、10年後も存続できるビジネスか",
    score: understandableScore,
    passed: understandableScore >= 60,
    details: hasSector
      ? `セクター: ${quote.sector} | 業種: ${quote.industry}`
      : "セクター情報なし — 事業内容の精査が必要",
    weight: 0.10,
  });

  // ----------------------------------------------------------
  // 2. 経済的な堀（Economic Moat）
  // 粗利益率・営業利益率・ROEの高さで持続的優位性を測定
  // ----------------------------------------------------------
  const gm = financials.grossMargin ?? 0;
  const om = financials.operatingMargin ?? 0;
  const roe = financials.returnOnEquity ?? 0;

  let moatScore = 0;
  // 粗利益率（ブランド力・価格決定力）
  if (gm >= 60) moatScore += 40;
  else if (gm >= 50) moatScore += 32;
  else if (gm >= 40) moatScore += 24;
  else if (gm >= 30) moatScore += 16;
  else moatScore += 8;
  // 営業利益率（コスト優位性）
  if (om >= 30) moatScore += 35;
  else if (om >= 20) moatScore += 27;
  else if (om >= 15) moatScore += 20;
  else if (om >= 10) moatScore += 12;
  else moatScore += 5;
  // 高ROE（無形資産・競争優位の証拠）
  if (roe >= 25) moatScore += 25;
  else if (roe >= 20) moatScore += 20;
  else if (roe >= 15) moatScore += 15;
  else if (roe >= 10) moatScore += 8;
  else moatScore += 2;

  principles.push({
    name: "経済的な堀",
    nameEn: "Economic Moat",
    description: "競合が容易に模倣できない持続的な競争優位性",
    score: Math.min(100, moatScore),
    passed: moatScore >= 60,
    details: `粗利益率: ${gm.toFixed(1)}% | 営業利益率: ${om.toFixed(1)}% | ROE: ${roe.toFixed(1)}%`,
    weight: 0.20,
  });

  // ----------------------------------------------------------
  // 3. 安全マージン（内在価値より安く買う）
  // 計算された内在価値と現在株価の乖離度を測定
  // ----------------------------------------------------------
  const pe = quote.trailingPE ?? 0;
  const pb = quote.priceToBook ?? 0;

  let marginScore = 50;
  // 内在価値との比較
  if (intrinsicValue && intrinsicValue > 0 && currentPrice > 0) {
    const discount = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
    if (discount >= 40) marginScore = 95;       // 40%以上割安
    else if (discount >= 25) marginScore = 80;  // 25%以上割安
    else if (discount >= 10) marginScore = 65;  // 10%以上割安
    else if (discount >= 0) marginScore = 50;   // 適正価格
    else if (discount >= -20) marginScore = 35; // やや割高
    else marginScore = 20;                       // 大幅割高
  } else {
    // 内在価値がない場合はPE/PBで代用
    if (pe > 0 && pe < 15) marginScore += 30;
    else if (pe > 0 && pe < 20) marginScore += 15;
    else if (pe > 0 && pe < 25) marginScore += 5;
    else if (pe > 40) marginScore -= 20;

    if (pb > 0 && pb < 1.5) marginScore += 20;
    else if (pb > 0 && pb < 3) marginScore += 10;
    else if (pb > 5) marginScore -= 10;
  }
  marginScore = Math.max(0, Math.min(100, marginScore));

  const intrinsicStr = intrinsicValue && currentPrice > 0
    ? `内在価値: $${intrinsicValue.toFixed(0)} | 現在値: $${currentPrice.toFixed(0)} | 乖離: ${(((intrinsicValue - currentPrice) / intrinsicValue) * 100).toFixed(1)}%`
    : `PER: ${pe > 0 ? pe.toFixed(1) : "N/A"} | PBR: ${pb > 0 ? pb.toFixed(2) : "N/A"}`;

  principles.push({
    name: "安全マージン",
    nameEn: "Margin of Safety",
    description: "内在価値に対して十分な割安度があるか（グレアムの原則）",
    score: marginScore,
    passed: marginScore >= 50,
    details: intrinsicStr,
    weight: 0.20,
  });

  // ----------------------------------------------------------
  // 4. 長期保有の耐久性（収益の一貫性）
  // ROE履歴の安定性・一貫した収益成長を評価
  // ----------------------------------------------------------
  const avgROE = roeHistory.length > 0
    ? roeHistory.reduce((sum, r) => sum + r.roe, 0) / roeHistory.length
    : roe;

  let durabilityScore = 50;
  // ROE履歴の安定性
  if (roeHistory.length >= 3) {
    const allAbove15 = roeHistory.every(r => r.roe > 15);
    const allAbove10 = roeHistory.every(r => r.roe > 10);
    const allPositive = roeHistory.every(r => r.roe > 0);
    if (allAbove15) durabilityScore += 35;
    else if (allAbove10) durabilityScore += 25;
    else if (allPositive) durabilityScore += 10;
    else durabilityScore -= 10;
  }
  // 平均ROEの高さ
  if (avgROE >= 20) durabilityScore += 15;
  else if (avgROE >= 15) durabilityScore += 10;
  else if (avgROE >= 10) durabilityScore += 5;
  else durabilityScore -= 5;

  durabilityScore = Math.max(0, Math.min(100, durabilityScore));
  const roeStr = roeHistory.length > 0
    ? `過去${roeHistory.length}年平均ROE: ${avgROE.toFixed(1)}% | 安定性: ${roeHistory.every(r => r.roe > 10) ? "良好" : "要確認"}`
    : `現在ROE: ${roe.toFixed(1)}% (履歴データなし)`;

  principles.push({
    name: "長期保有の耐久性",
    nameEn: "Long-term Durability",
    description: "10年以上保有に値する安定・一貫した収益力",
    score: durabilityScore,
    passed: durabilityScore >= 60,
    details: roeStr,
    weight: 0.15,
  });

  // ----------------------------------------------------------
  // 5. 優れた経営者への信頼
  // 定量: ROE/ROA/純利益率 (60%) + CEO評判スコア (40%)
  // ----------------------------------------------------------
  const roa = financials.returnOnAssets ?? 0;
  const nm = financials.netMargin ?? 0;

  // 定量スコア
  const quantScore = Math.min(100,
    Math.min(roe / 25, 1) * 40 +
    Math.min(roa / 15, 1) * 30 +
    Math.min(nm / 20, 1) * 30
  );

  // CEO評判スコア（known CEOのみ）
  const { score: ceoScore, innovatorScore, ceo } = getCEOScore(quote.symbol ?? '');
  const mgmtScore = ceoScore >= 0
    ? quantScore * 0.6 + ceoScore * 0.4   // CEO既知: 定量60% + バフェット目線CEO40%
    : quantScore;                           // CEO不明: 定量のみ

  // details文字列: バフェット目線と起業家目線の両方を表示
  let mgmtDetails: string;
  if (ceo) {
    const innovatorNote = ceo.isFounder && innovatorScore >= 0
      ? ` | 起業家目線: ${innovatorScore}/100`
      : '';
    mgmtDetails = `${ceo.name} (${ceo.title}) | ROE: ${roe.toFixed(1)}% | バフェット目線: ${ceoScore}/100${innovatorNote}`;
  } else {
    mgmtDetails = `ROE: ${roe.toFixed(1)}% | ROA: ${roa.toFixed(1)}% | 純利益率: ${nm.toFixed(1)}%`;
  }

  principles.push({
    name: "優れた経営者への信頼",
    nameEn: "Quality Management",
    description: "株主資本を効率よく活用し高いリターンを生む経営 + CEO評価",
    score: Math.round(mgmtScore),
    passed: mgmtScore >= 60,
    details: mgmtDetails,
    weight: 0.15,
  });

  // ----------------------------------------------------------
  // 6. Mr.マーケットの活用（師：グレアム）
  // 市場の過剰反応を利用して割安に買えるかを評価
  // ----------------------------------------------------------
  const dte = financials.debtToEquity ?? 0;
  const cr = financials.currentRatio ?? 1;

  let mrMarketScore = 50;
  // PERによる割安度（市場が過小評価しているか）
  if (pe > 0 && pe < 12) mrMarketScore += 30;      // かなり割安
  else if (pe > 0 && pe < 18) mrMarketScore += 20;  // 割安
  else if (pe > 0 && pe < 25) mrMarketScore += 10;  // 適正
  else if (pe > 35) mrMarketScore -= 15;             // 割高
  // PBRによる清算価値との比較
  if (pb > 0 && pb < 1.0) mrMarketScore += 20;      // 清算価値以下
  else if (pb > 0 && pb < 2.0) mrMarketScore += 10;
  else if (pb > 4.0) mrMarketScore -= 10;
  // 財務健全性（ミスターマーケットが売る理由がない強固な財務）
  if (dte < 50) mrMarketScore += 10;
  else if (dte > 200) mrMarketScore -= 15;
  if (cr >= 1.5) mrMarketScore += 5;
  else if (cr < 1.0) mrMarketScore -= 10;

  mrMarketScore = Math.max(0, Math.min(100, mrMarketScore));
  principles.push({
    name: "Mr.マーケットの活用",
    nameEn: "Mr. Market Advantage",
    description: "市場の非合理な価格変動を味方につけ割安で買えるか",
    score: mrMarketScore,
    passed: mrMarketScore >= 50,
    details: `PER: ${pe > 0 ? pe.toFixed(1) : "N/A"} | PBR: ${pb > 0 ? pb.toFixed(2) : "N/A"} | D/E: ${dte.toFixed(0)}%`,
    weight: 0.10,
  });

  // ----------------------------------------------------------
  // 7. 顧客に愛されているか（ブランド力）
  // 高い粗利益率・売上成長・価格決定力でブランド強度を測定
  // ----------------------------------------------------------
  const revGrowth = financials.revenueGrowth ?? 0;
  const earnGrowth = financials.earningsGrowth ?? 0;

  let brandScore = 30;
  // 粗利益率（価格決定力 = 顧客の支払い意欲）
  if (gm >= 70) brandScore += 40;
  else if (gm >= 60) brandScore += 35;
  else if (gm >= 50) brandScore += 28;
  else if (gm >= 40) brandScore += 20;
  else if (gm >= 30) brandScore += 12;
  else brandScore += 5;
  // 売上成長率（顧客が増え続けているか）
  if (revGrowth >= 20) brandScore += 20;
  else if (revGrowth >= 10) brandScore += 15;
  else if (revGrowth >= 5) brandScore += 8;
  else if (revGrowth < 0) brandScore -= 10;
  // 利益成長率（顧客が価値を認め続けているか）
  if (earnGrowth >= 20) brandScore += 10;
  else if (earnGrowth >= 10) brandScore += 5;
  else if (earnGrowth < 0) brandScore -= 5;

  brandScore = Math.max(0, Math.min(100, brandScore));
  principles.push({
    name: "顧客に愛されているか",
    nameEn: "Customer Love & Brand",
    description: "顧客が高い価格を喜んで払うブランド力・価格決定力",
    score: brandScore,
    passed: brandScore >= 55,
    details: `粗利益率: ${gm.toFixed(1)}% | 売上成長: ${revGrowth.toFixed(1)}% | 利益成長: ${earnGrowth.toFixed(1)}%`,
    weight: 0.10,
  });

  // ----------------------------------------------------------
  // 総合スコア計算（加重平均）
  // ----------------------------------------------------------
  const totalScore = Math.round(
    principles.reduce((sum, p) => sum + p.score * p.weight, 0)
  );

  // 10倍株確率の計算
  const tenBaggerProbability = calculateTenBaggerProbability(
    totalScore, financials, quote, roeHistory
  );

  // シグナル判定
  const passedCount = principles.filter(p => p.passed).length;
  let signal: "BUY" | "HOLD" | "PASS";
  let signalStrength: number;

  if (totalScore >= 72 && passedCount >= 5) {
    signal = "BUY";
    signalStrength = Math.min(100, totalScore + 10);
  } else if (totalScore >= 52 && passedCount >= 4) {
    signal = "HOLD";
    signalStrength = totalScore;
  } else {
    signal = "PASS";
    signalStrength = Math.max(0, totalScore - 10);
  }

  const summary = generateSummary(principles, totalScore, signal, tenBaggerProbability);

  return {
    principles,
    totalScore,
    signal,
    signalStrength,
    tenBaggerProbability,
    summary,
  };
}

// ----------------------------------------------------------
// 10倍株確率計算
// ----------------------------------------------------------
function calculateTenBaggerProbability(
  overallScore: number,
  financials: YahooFinancials,
  quote: YahooQuote,
  roeHistory: Array<{ year: number; roe: number }>
): number {
  let probability = 0;

  // 基本スコアから（最大30%）
  probability += Math.min(30, overallScore * 0.3);

  // 高成長（最大25%）
  const rg = financials.revenueGrowth ?? 0;
  if (rg > 25) probability += 25;
  else if (rg > 15) probability += 15;
  else if (rg > 8) probability += 8;

  // ROEの安定性と高さ（最大20%）
  const avgROE = roeHistory.length > 0
    ? roeHistory.reduce((sum, r) => sum + r.roe, 0) / roeHistory.length
    : (financials.returnOnEquity ?? 0);
  if (avgROE >= 25) probability += 20;
  else if (avgROE >= 20) probability += 15;
  else if (avgROE >= 15) probability += 10;

  // 割安度（最大15%）
  const qPE = quote.trailingPE ?? 0;
  if (qPE > 0 && qPE < 15) probability += 15;
  else if (qPE > 0 && qPE < 20) probability += 10;
  else if (qPE > 0 && qPE < 25) probability += 5;

  // 時価総額（小型の方が10倍になりやすい）（最大10%）
  const qMC = quote.marketCap ?? 0;
  if (qMC > 0 && qMC < 10e9) probability += 10;
  else if (qMC > 0 && qMC < 50e9) probability += 6;
  else if (qMC > 0 && qMC < 100e9) probability += 3;

  return Math.round(Math.min(100, Math.max(0, probability)));
}

// ----------------------------------------------------------
// サマリー生成
// ----------------------------------------------------------
function generateSummary(
  principles: BuffettPrincipleScore[],
  totalScore: number,
  signal: "BUY" | "HOLD" | "PASS",
  tenBaggerProbability: number
): string {
  const passedPrinciples = principles.filter(p => p.passed);
  const failedPrinciples = principles.filter(p => !p.passed);

  let summary = "";
  if (signal === "BUY") {
    summary = `バフェット基準を${passedPrinciples.length}/7項目クリア。総合スコア${totalScore}点は優秀な水準です。`;
  } else if (signal === "HOLD") {
    summary = `バフェット基準を${passedPrinciples.length}/7項目クリア。投資対象として検討の余地があります。`;
  } else {
    summary = `バフェット基準を${passedPrinciples.length}/7項目のみクリア。現時点での投資は見送りが妥当です。`;
  }

  if (failedPrinciples.length > 0 && failedPrinciples.length <= 3) {
    summary += ` 改善が必要な点: ${failedPrinciples.map(p => p.name).join("、")}。`;
  }

  if (tenBaggerProbability >= 50) {
    summary += ` 10倍株の可能性: ${tenBaggerProbability}%と高い水準です。`;
  } else if (tenBaggerProbability >= 30) {
    summary += ` 10倍株の可能性: ${tenBaggerProbability}%。条件次第で大化け期待。`;
  }

  return summary;
}
