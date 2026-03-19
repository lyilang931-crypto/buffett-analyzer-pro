// SEC EDGAR 13F Parser — Berkshire Hathaway Portfolio

export interface Holding {
  rank: number;
  nameOfIssuer: string;
  ticker: string;          // derived from CUSIP lookup
  cusip: string;
  valueDollars: number;    // market value in USD
  shares: number;          // number of shares
  portfolioPercent: number;
  change: 'NEW' | 'SOLD' | 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  changeShares: number;    // +/- shares vs previous quarter
  changePercent: number;   // % change in shares vs previous quarter
}

export interface BerkshirePortfolio {
  periodOfReport: string;  // e.g. "2025-12-31"
  filingDate: string;
  totalValueDollars: number;
  holdings: Holding[];
  prevPeriodOfReport: string;
  fetchedAt: string;
}

// CUSIP → Ticker mapping for Berkshire's known holdings
const CUSIP_TICKER: Record<string, string> = {
  '037833100': 'AAPL',   // Apple
  '025816109': 'AXP',    // American Express
  '060505104': 'BAC',    // Bank of America
  '191216100': 'KO',     // Coca-Cola
  '166764100': 'CVX',    // Chevron
  '615369105': 'MCO',    // Moody's
  '674599105': 'OXY',    // Occidental Petroleum
  'H1467J104': 'CB',     // Chubb
  '500754106': 'KHC',    // Kraft Heinz
  '02079K305': 'GOOG',   // Alphabet Class C
  '02079K107': 'GOOGL',  // Alphabet Class A
  '023135106': 'AMZN',   // Amazon
  '23918K108': 'DVA',    // DaVita
  '501044101': 'KR',     // Kroger
  '92826C839': 'V',      // Visa
  '829933100': 'SIRI',   // Sirius XM
  '57636Q104': 'MA',     // Mastercard
  '92343E102': 'VRSN',   // VeriSign
  '21036P108': 'STZ',    // Constellation Brands
  '14040H105': 'COF',    // Capital One
  '91324P102': 'UNH',    // UnitedHealth
  '25754A201': 'DPZ',    // Domino's Pizza
  '02005N100': 'ALLY',   // Ally Financial
  'G0403H108': 'AON',    // Aon
  '670346105': 'NUE',    // Nucor
  '530909308': 'LLYVK',  // Liberty Live (Series C)
  '526057104': 'LEN',    // Lennar Class A
  '73278L105': 'POOL',   // Pool Corp
  '546347105': 'LPX',    // Louisiana-Pacific
  '650111107': 'NYT',    // New York Times
  '422806208': 'HEI',    // HEICO Corp
  '531229755': 'FWONA',  // Liberty Media
  '16119P108': 'CHTR',   // Charter Communications
  '512816109': 'LAMR',   // Lamar Advertising
  'G0176J109': 'ALLE',   // Allegion
  '62944T105': 'NVR',    // NVR Inc
  '47233W109': 'JEF',    // Jefferies Financial
  '25243Q205': 'DEO',    // Diageo
  'G9001E102': 'LILA',   // Liberty Latin America A
  'G9001E128': 'LILAK',  // Liberty Latin America C
  '530909100': 'LLYVA',  // Liberty Live (Series A)
  '047726302': 'BATRK',  // Atlanta Braves Holdings
};

// Human-readable name overrides for SEC's terse names
const NAME_OVERRIDES: Record<string, string> = {
  '037833100': 'Apple',
  '025816109': 'American Express',
  '060505104': 'Bank of America',
  '191216100': 'Coca-Cola',
  '166764100': 'Chevron',
  '615369105': "Moody's",
  '674599105': 'Occidental Petroleum',
  'H1467J104': 'Chubb',
  '500754106': 'Kraft Heinz',
  '02079K305': 'Alphabet (GOOG)',
  '023135106': 'Amazon',
  '23918K108': 'DaVita',
  '501044101': 'Kroger',
  '92826C839': 'Visa',
  '829933100': 'Sirius XM',
  '57636Q104': 'Mastercard',
  '92343E102': 'VeriSign',
  '21036P108': 'Constellation Brands',
  '14040H105': 'Capital One',
  '91324P102': 'UnitedHealth',
  '25754A201': "Domino's Pizza",
  '02005N100': 'Ally Financial',
  'G0403H108': 'Aon',
  '670346105': 'Nucor',
  '526057104': 'Lennar',
  '73278L105': 'Pool Corp',
  '546347105': 'Louisiana-Pacific',
  '650111107': 'New York Times',
  '422806208': 'HEICO',
  '16119P108': 'Charter Communications',
  '512816109': 'Lamar Advertising',
  'G0176J109': 'Allegion',
  '62944T105': 'NVR',
  '47233W109': 'Jefferies Financial',
  '25243Q205': 'Diageo',
};

// Berkshire Hathaway CIK
const BERKSHIRE_CIK = '0001067983';
const SEC_HEADERS = {
  'User-Agent': 'Moat-StockAnalyzer/1.0 (Educational use; contact@moat.app)',
  'Accept-Encoding': 'gzip, deflate',
};

// Get the 2 most recent 13F-HR accession numbers
async function getLatest13FAccessions(): Promise<{ accession: string; period: string; filingDate: string }[]> {
  const url = `https://data.sec.gov/submissions/CIK${BERKSHIRE_CIK}.json`;
  const res = await fetch(url, { headers: SEC_HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`SEC submissions fetch failed: ${res.status}`);
  const data = await res.json();

  const filings = data.filings.recent;
  const results: { accession: string; period: string; filingDate: string }[] = [];

  for (let i = 0; i < filings.form.length; i++) {
    if (filings.form[i] === '13F-HR') {
      results.push({
        accession: filings.accessionNumber[i],
        period: filings.reportDate[i],
        filingDate: filings.filingDate[i],
      });
      if (results.length === 2) break;
    }
  }
  return results;
}

// Find the InfoTable XML filename from the filing index
async function getInfoTableFilename(accession: string): Promise<string> {
  const accDir = accession.replace(/-/g, '');
  const cik = BERKSHIRE_CIK.replace(/^0+/, '');
  const indexUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accDir}/${accession}-index.htm`;
  const res = await fetch(indexUrl, { headers: SEC_HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Filing index fetch failed: ${res.status}`);
  const html = await res.text();
  // Find XML file that is NOT primary_doc.xml
  const match = html.match(/href="[^"]*\/(\d+\.xml)"/);
  if (!match) throw new Error('InfoTable XML not found in index');
  return match[1];
}

// Fetch and parse InfoTable XML into raw holdings map: CUSIP → { value, shares }
async function fetchAndParseInfoTable(
  accession: string
): Promise<Map<string, { name: string; valueDollars: number; shares: number }>> {
  const xmlFile = await getInfoTableFilename(accession);
  const accDir = accession.replace(/-/g, '');
  const cik = BERKSHIRE_CIK.replace(/^0+/, '');
  const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accDir}/${xmlFile}`;

  const res = await fetch(xmlUrl, { headers: SEC_HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`InfoTable XML fetch failed: ${res.status}`);
  const xml = await res.text();

  const map = new Map<string, { name: string; valueDollars: number; shares: number }>();

  // Parse each <infoTable> block
  const blocks = xml.split('<infoTable>').slice(1);
  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : '';
    };
    const cusip = get('cusip');
    if (!cusip) continue;
    const valueDollars = parseInt(get('value')) || 0;
    const shares = parseInt(get('sshPrnamt')) || 0;
    const name = get('nameOfIssuer');

    const existing = map.get(cusip);
    if (existing) {
      existing.valueDollars += valueDollars;
      existing.shares += shares;
    } else {
      map.set(cusip, { name, valueDollars, shares });
    }
  }
  return map;
}

// In-memory cache
let cachedPortfolio: BerkshirePortfolio | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function getBerkshirePortfolio(): Promise<BerkshirePortfolio> {
  // Return cache if fresh
  if (cachedPortfolio && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedPortfolio;
  }

  // Get 2 most recent filings
  const [latest, prev] = await getLatest13FAccessions();
  if (!latest || !prev) throw new Error('Could not find 13F filings');

  // Fetch both quarters in parallel
  const [currentMap, prevMap] = await Promise.all([
    fetchAndParseInfoTable(latest.accession),
    fetchAndParseInfoTable(prev.accession),
  ]);

  // Build holdings list with change data
  const holdings: Holding[] = [];
  let totalValue = 0;

  // Collect all CUSIPs from current quarter
  currentMap.forEach((_val, cusip) => {
    totalValue += currentMap.get(cusip)!.valueDollars;
  });

  let rank = 1;
  // Sort current holdings by value
  const sortedEntries = Array.from(currentMap.entries()).sort((a, b) => b[1].valueDollars - a[1].valueDollars);

  for (const [cusip, curr] of sortedEntries) {
    const prevHolding = prevMap.get(cusip);
    let change: Holding['change'] = 'UNCHANGED';
    let changeShares = 0;
    let changePercent = 0;

    if (!prevHolding) {
      change = 'NEW';
    } else {
      changeShares = curr.shares - prevHolding.shares;
      changePercent = prevHolding.shares > 0
        ? ((curr.shares - prevHolding.shares) / prevHolding.shares) * 100
        : 0;
      if (Math.abs(changePercent) < 0.5) {
        change = 'UNCHANGED';
      } else if (changeShares > 0) {
        change = 'INCREASED';
      } else {
        change = 'DECREASED';
      }
    }

    const ticker = CUSIP_TICKER[cusip] ?? '';
    const displayName = NAME_OVERRIDES[cusip] ??
      curr.name.replace(/ INC$| CORP$| CO$| LTD$| PLC$| NEW$/, '').trim();

    holdings.push({
      rank: rank++,
      nameOfIssuer: displayName,
      ticker,
      cusip,
      valueDollars: curr.valueDollars,
      shares: curr.shares,
      portfolioPercent: totalValue > 0 ? (curr.valueDollars / totalValue) * 100 : 0,
      change,
      changeShares,
      changePercent,
    });
  }

  // Also find SOLD positions (in prev but not in current)
  prevMap.forEach((_val, cusip) => {
    if (!currentMap.has(cusip)) {
      const prev = prevMap.get(cusip)!;
      const ticker = CUSIP_TICKER[cusip] ?? '';
      const displayName = NAME_OVERRIDES[cusip] ??
        prev.name.replace(/ INC$| CORP$| CO$| LTD$| PLC$| NEW$/, '').trim();
      holdings.push({
        rank: rank++,
        nameOfIssuer: displayName,
        ticker,
        cusip,
        valueDollars: 0,
        shares: 0,
        portfolioPercent: 0,
        change: 'SOLD',
        changeShares: -prev.shares,
        changePercent: -100,
      });
    }
  });

  const portfolio: BerkshirePortfolio = {
    periodOfReport: latest.period,
    filingDate: latest.filingDate,
    totalValueDollars: totalValue,
    holdings,
    prevPeriodOfReport: prev.period,
    fetchedAt: new Date().toISOString(),
  };

  cachedPortfolio = portfolio;
  cacheTime = Date.now();
  return portfolio;
}
