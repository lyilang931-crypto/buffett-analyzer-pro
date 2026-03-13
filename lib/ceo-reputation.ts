export interface CEOReputation {
  name: string;
  title: string;
  tenureYears: number;
  reputationScore: number;        // 0-100: market/public confidence
  capitalAllocationScore: number; // 0-100: ROE/buybacks/dividends track record
  visionScore: number;            // 0-100: strategic vision
  controversyPenalty: number;     // 0-50: subtract for controversies/risks
  highlights: string[];
  concerns: string[];
}

// Known CEO database – symbol → CEOReputation
export const CEO_DATABASE: Record<string, CEOReputation> = {
  AAPL: {
    name: 'Tim Cook', title: 'CEO',
    tenureYears: 13,
    reputationScore: 88,
    capitalAllocationScore: 95,  // Massive buybacks, consistent dividends
    visionScore: 75,
    controversyPenalty: 5,
    highlights: ['過去10年で株主還元$1兆超', 'サービス部門を育て安定収益化', '安定したサプライチェーン管理'],
    concerns: ['ジョブズ後のイノベーション鈍化懸念'],
  },
  NVDA: {
    name: 'Jensen Huang', title: 'CEO',
    tenureYears: 31,
    reputationScore: 99,
    capitalAllocationScore: 97,
    visionScore: 100,
    controversyPenalty: 0,
    highlights: [
      'AIブームを10年前から見据えたCUDA戦略 — 競合が真似できない護城河を構築',
      '創業31年・在任中に時価総額を$3兆超へ。バフェット級の長期経営者',
      'データセンター売上が3年で10倍超、営業利益率60%超を達成',
    ],
    concerns: ['高い株価評価に対するプレッシャー'],
  },
  MSFT: {
    name: 'Satya Nadella', title: 'CEO',
    tenureYears: 10,
    reputationScore: 95,
    capitalAllocationScore: 92,
    visionScore: 96,
    controversyPenalty: 0,
    highlights: ['クラウド転換を成功させ時価総額3倍超', 'OpenAI/AI統合でリード', '文化改革と社員エンゲージメント向上'],
    concerns: ['Activision買収等の大型M&Aリスク'],
  },
  GOOGL: {
    name: 'Sundar Pichai', title: 'CEO',
    tenureYears: 9,
    reputationScore: 80,
    capitalAllocationScore: 82,
    visionScore: 80,
    controversyPenalty: 8,
    highlights: ['YouTube・Cloudを成長させた', 'AI研究（Gemini）で競争力維持', '資本効率改善（buyback拡大）'],
    concerns: ['AI競争でOpenAI/MSFTに後れを取る懸念', '独占規制リスク', 'レイオフ後の文化変容'],
  },
  META: {
    name: 'Mark Zuckerberg', title: 'CEO',
    tenureYears: 20,
    reputationScore: 72,
    capitalAllocationScore: 78,
    visionScore: 85,
    controversyPenalty: 15,
    highlights: ['メタバース失敗後のAI転換が奏功', '2023年「効率化の年」で利益率急回復', 'Instagram/WhatsApp統合'],
    concerns: ['メタバース投資の巨額損失（$40B超）', 'プライバシー規制リスク', 'ユーザー信頼度低下'],
  },
  TSLA: {
    name: 'Elon Musk', title: 'CEO',
    tenureYears: 15,
    reputationScore: 78,
    capitalAllocationScore: 65,
    visionScore: 98,
    // バフェット基準での減点: 兼業リスク・ブランド毀損（欧州販売-40%）・X買収損失
    // 起業家・ビジョナリーとしては世界最高水準だが、
    // バフェットが重視する「予測可能性・資本規律・株主への誠実さ」で減点
    controversyPenalty: 18,
    highlights: [
      'EV・宇宙・AI・エネルギーを同時変革する史上稀な連続起業家',
      'テスラを単なる自動車会社からエネルギー/AIロボット企業へ転換',
      'ビジョンの壮大さと実行力はジェンスン・ファンと並ぶ世界最高水準',
    ],
    concerns: [
      'X(旧Twitter)買収で$440億超を投入、テスラ経営への集中力が分散',
      '政治的言動によるブランドリスク（2025年欧州販売台数-40%超）',
      '株式報酬問題・SEC摩擦など株主との関係で予測困難な側面',
      '後継者不在リスク（バフェットはこれを最重要視）',
    ],
  },
  AMZN: {
    name: 'Andy Jassy', title: 'CEO',
    tenureYears: 3,
    reputationScore: 82,
    capitalAllocationScore: 80,
    visionScore: 85,
    controversyPenalty: 5,
    highlights: ['AWSのAI転換を加速', 'コスト削減と利益率改善を実現', 'ベゾス後の安定した移行'],
    concerns: ['ベゾスほどの存在感・ビジョンの差', '労働問題・規制リスク'],
  },
  V: {
    name: 'Ryan McInerney', title: 'CEO',
    tenureYears: 2,
    reputationScore: 78,
    capitalAllocationScore: 90,
    visionScore: 78,
    controversyPenalty: 3,
    highlights: ['安定した決済ネットワーク運営', '一貫した株主還元（buyback・配当）', '新興国キャッシュレス化の恩恵'],
    concerns: ['任期が短く実績評価が限定的'],
  },
  MA: {
    name: 'Michael Miebach', title: 'CEO',
    tenureYears: 4,
    reputationScore: 80,
    capitalAllocationScore: 88,
    visionScore: 80,
    controversyPenalty: 2,
    highlights: ['フィンテック・暗号資産領域への適切な展開', '安定した収益成長の維持'],
    concerns: ['規制リスク（Visa同様）'],
  },
  'BRK-B': {
    name: 'Warren Buffett / Greg Abel', title: 'CEO / CEO指定後継者',
    tenureYears: 59,
    reputationScore: 99,
    capitalAllocationScore: 99,
    visionScore: 95,
    controversyPenalty: 0,
    highlights: ['史上最も優れた資本配分者の一人', '1965年以来年平均19.8%のリターン', 'グレッグ・エイベルへの計画的な引き継ぎ'],
    concerns: ['バフェット引退後の後継リスク', '巨大化により高成長が構造的に困難'],
  },
  JNJ: {
    name: 'Joaquin Duato', title: 'CEO',
    tenureYears: 3,
    reputationScore: 75,
    capitalAllocationScore: 85,
    visionScore: 76,
    controversyPenalty: 10,
    highlights: ['医薬品・医療機器への集中（消費者部門分離）', '配当王（61年連続増配）'],
    concerns: ['タルク粉石けん訴訟リスク', '後継CEOとして実績評価が発展途上'],
  },
  '7203.T': {
    name: '佐藤恒治', title: '社長',
    tenureYears: 2,
    reputationScore: 78,
    capitalAllocationScore: 82,
    visionScore: 80,
    controversyPenalty: 5,
    highlights: ['EV戦略の見直しとマルチパスウェイ戦略の明確化', '積極的な株主還元の拡充', '収益性改善への取り組み'],
    concerns: ['BEV化の出遅れ懸念', 'ダイハツ不正問題対応'],
  },
  '9984.T': {
    name: '孫正義', title: '社長・創業者',
    tenureYears: 44,
    reputationScore: 90,
    capitalAllocationScore: 68,
    visionScore: 99,
    // バフェット基準での減点: 高レバレッジ・WeWork損失・ガバナンス
    // ビジョナリーとしては孫正義はマスクと並ぶ世界最高水準
    // ただしバフェットが嫌う「借金での大博打」スタイル
    controversyPenalty: 12,
    highlights: [
      '44年の実績 — アリババへの$2000万投資が$1500億超に（ROI数千倍）',
      'AI時代を10年以上前から確信し、ARM買収・Vision Fund設立で先手',
      '創業者として30年超の長期経営、日本の起業家の中で突出した国際視野',
    ],
    concerns: [
      'WeWork等のVision Fund1で$40B超の損失（資本配分の失敗例）',
      '高レバレッジ戦略はバフェットが最も嫌う財務スタイル',
      '投資先への集中投資によるボラティリティの高さ',
    ],
  },
};

// CEO score for principle #5 (0-100)
export function getCEOScore(symbol: string): { score: number; ceo: CEOReputation | null } {
  const ceo = CEO_DATABASE[symbol] ?? null;
  if (!ceo) return { score: -1, ceo: null }; // -1 = unknown, use quantitative only

  const base =
    ceo.reputationScore * 0.35 +
    ceo.capitalAllocationScore * 0.40 +
    ceo.visionScore * 0.25 -
    ceo.controversyPenalty;

  return { score: Math.round(Math.max(0, Math.min(100, base))), ceo };
}
