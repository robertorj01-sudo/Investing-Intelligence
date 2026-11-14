export type MarketRegion = 'B3' | 'US';

export type FeedStatus =
  | 'real_time'
  | 'delayed_15m'
  | 'eod_closing'
  | 'official_bcb'
  | 'reference_snapshot';

export type SectorProfile =
  | 'Bancos & Financeiro'
  | 'Tecnologia & Software'
  | 'Semicondutores & IA'
  | 'Energia & Commodities'
  | 'Indústria & Bens de Capital'
  | 'Consumo & Varejo'
  | 'Saúde & Biotecnologia'
  | 'Utilidade Pública & Saneamento'
  | 'Cibersegurança & Cloud';

export interface MarketIndexQuote {
  symbol: string;
  name: string;
  market: MarketRegion;
  category: 'index' | 'fx' | 'rate' | 'volatility';
  value: number;
  unit: 'pts' | 'BRL' | '%' | 'idx';
  change: number;
  changePct: number;
  volumeLabel: string;
  sparkline: number[];
  source: string;
  feedStatus: FeedStatus;
  updatedAt: string;
}

export interface FundamentalMetricDetail {
  key: string;
  label: string;
  value: number | null;
  formattedValue: string;
  unit: 'x' | '%' | 'currency' | 'ratio';
  historicalMean: number | null;
  sectorAverage: number | null;
  historicalSeries: { period: string; value: number | null }[];
  applicable: boolean;
  didacticExplanation: string;
  interpretation: string;
  signal: 'favorable' | 'neutral' | 'caution' | 'na';
}

export interface FinancialStatementPeriod {
  period: string; // e.g., '2025' or '3T25'
  type: 'annual' | 'quarterly';
  revenue: number; // in millions (BRL for B3, USD for US)
  grossProfit: number;
  ebitda: number;
  ebit: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  grossDebt: number;
  netDebt: number;
  operatingCashFlow: number;
  capex: number;
  freeCashFlow: number;
}

export interface DividendEvent {
  exDate: string;
  paymentDate: string;
  type: 'Dividendo' | 'JCP' | 'Cash Dividend';
  amountPerShare: number;
  currency: 'BRL' | 'USD';
  yieldOnDatePct: number;
}

export interface PriceBar {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface InvestScoreBreakdown {
  totalScore: number; // 0 - 100
  classification: 'Excelente' | 'Forte' | 'Equilibrada' | 'Atenção' | 'Elevado Risco';
  sectorProfile: SectorProfile;
  methodologyNote: string;
  referenceDate: string;
  pillars: {
    key:
      | 'growth'
      | 'profitability'
      | 'financialHealth'
      | 'competitiveAdvantage'
      | 'valuation'
      | 'cashGeneration'
      | 'risk';
    label: string;
    score: number;
    weightPct: number;
    weightedContribution: number;
    rationale: string;
  }[];
}

export interface EquityOverview {
  ticker: string;
  yahooSymbol: string;
  name: string;
  market: MarketRegion;
  exchange: 'B3' | 'NYSE' | 'NASDAQ';
  currency: 'BRL' | 'USD';
  sector: SectorProfile;
  segment: string;
  tags: string[]; // e.g. 'Blue Chips', 'Dividend Stocks', 'Inteligência Artificial'
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  marketCapMillions: number;
  volumeMillions: number;
  avgDailyVolumeMillions: number;
  high52w: number;
  low52w: number;
  sharesOutstandingMillions: number;
  freeFloatPct: number;
  beta: number;
  dividendFrequency: string;
  nextEarningsDate: string;
  source: string;
  feedStatus: FeedStatus;
  updatedAt: string;
  referenceStatementDate: string;
  // Core computed metrics for fast screening & comparison
  metricsSummary: {
    pe: number | null;
    pb: number | null;
    psr: number | null;
    evEbitda: number | null;
    evEbit: number | null;
    peg: number | null;
    roe: number | null;
    roic: number | null;
    roa: number | null;
    grossMargin: number | null;
    ebitdaMargin: number | null;
    netMargin: number | null;
    netDebtEbitda: number | null;
    currentRatio: number | null;
    dividendYield: number | null;
    payout: number | null;
    revenueCagr5y: number | null;
    earningsCagr5y: number | null;
    eps: number | null;
    fcfMillions: number | null;
    pfcf: number | null;
    rsi14: number;
    aboveSma200: boolean;
    macdPositive: boolean;
    volumeAboveAvg: boolean;
  };
  investScore: InvestScoreBreakdown;
}

export interface EquityFullDetail extends EquityOverview {
  fundamentals: FundamentalMetricDetail[];
  statementsAnnual: FinancialStatementPeriod[];
  statementsQuarterly: FinancialStatementPeriod[];
  dividends: DividendEvent[];
  priceHistory: PriceBar[];
  strengths: string[];
  weaknesses: string[];
  description: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category:
    | 'Brasil'
    | 'Estados Unidos'
    | 'Empresas'
    | 'Tecnologia'
    | 'Economia'
    | 'Política Monetária'
    | 'Resultados Corporativos'
    | 'Commodities';
  source: string;
  publishedAt: string;
  summary: string;
  aiImpactNote: string;
  affectedTickers: string[];
  affectedSectors: string[];
}

export interface EconomicCalendarEvent {
  id: string;
  date: string;
  time: string;
  country: 'BR' | 'US';
  event: string;
  category: 'Política Monetária' | 'Inflação & Emprego' | 'PIB & Atividade' | 'Resultados' | 'Dividendos';
  importance: 'Alta' | 'Média';
  previous: string;
  forecast: string;
  actual?: string;
  relatedTicker?: string;
}

export interface AIStockReport {
  title: string;
  tickersAnalyzed: string[];
  dataReferenceDate: string;
  disclaimer: string;
  assumptions: string[];
  sections: {
    executiveSummary: string;
    companyQuality: string;
    growth: string;
    profitability: string;
    financialHealth: string;
    valuation: string;
    upsidePotential: string;
    risks: string;
    scenarios: {
      optimistic: string;
      base: string;
      pessimistic: string;
    };
    conclusion: string;
  };
  rawMarkdown?: string;
}
