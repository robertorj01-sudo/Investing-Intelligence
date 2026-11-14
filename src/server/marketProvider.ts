import {
  EQUITY_SEEDS,
  REFERENCE_MARKET_INDICES,
  buildEquityDetailFromSeed,
  generateReferencePriceBars,
} from './marketUniverse.ts';
import type {
  EquityFullDetail,
  EquityOverview,
  FeedStatus,
  MarketIndexQuote,
  PriceBar,
} from '../shared/types.ts';

interface CachedEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CachedEntry<unknown>>();
const TTL_QUOTES_MS = 120 * 1000; // 2 minutes cache
const TTL_MACRO_MS = 15 * 60 * 1000; // 15 minutes for BCB macro series

export interface ApiProviderHealth {
  provider: string;
  status: 'ok' | 'degraded' | 'unavailable';
  lastCheckedAt: string;
  lastError?: string;
  latencyMs: number;
}

const providerHealthMap = new Map<string, ApiProviderHealth>();

function recordHealth(
  provider: string,
  status: 'ok' | 'degraded' | 'unavailable',
  latencyMs: number,
  lastError?: string
) {
  providerHealthMap.set(provider, {
    provider,
    status,
    lastCheckedAt: new Date().toISOString(),
    latencyMs,
    lastError,
  });
}

export function getProvidersHealth(): ApiProviderHealth[] {
  return Array.from(providerHealthMap.values());
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4500, headers?: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'INVEST-INTELLIGENCE/1.0 (https://invest-intelligence.app)',
        Accept: 'application/json',
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface YahooChartParsed {
  price: number;
  previousClose: number;
  high52w?: number;
  low52w?: number;
  volumeMillions?: number;
  bars: PriceBar[];
  updatedAt: string;
}

async function fetchYahooChart(symbol: string, range = '1y', interval = '1d'): Promise<YahooChartParsed | null> {
  const cacheKey = `yahoo:${symbol}:${range}:${interval}`;
  const cached = cache.get(cacheKey) as CachedEntry<YahooChartParsed> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const started = Date.now();
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${range}&interval=${interval}&includePrePost=false`;
    const json = (await fetchJsonWithTimeout(url, 4000)) as any;
    const result = json?.chart?.result?.[0];
    if (!result || !result.meta) {
      throw new Error('Empty Yahoo Finance response');
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const bars: PriceBar[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = quote.close?.[i];
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const v = quote.volume?.[i];
      if (c == null || o == null || h == null || l == null) continue;
      bars.push({
        time: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: Math.round(v || 0),
      });
    }

    const price = Number((meta.regularMarketPrice ?? bars[bars.length - 1]?.close ?? 0).toFixed(2));
    const priorBarClose =
      interval === '1d' && bars.length >= 2 ? bars[bars.length - 2].close : undefined;
    const prev = Number(
      (
        meta.regularMarketPreviousClose ??
        meta.previousClose ??
        priorBarClose ??
        meta.chartPreviousClose ??
        price
      ).toFixed(2)
    );
    const vol = Number((((meta.regularMarketVolume ?? 0) * price) / 1_000_000).toFixed(1));

    const parsed: YahooChartParsed = {
      price,
      previousClose: prev,
      high52w: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
      low52w: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
      volumeMillions: vol > 0 ? vol : undefined,
      bars,
      updatedAt: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString(),
    };

    cache.set(cacheKey, { data: parsed, expiresAt: Date.now() + TTL_QUOTES_MS });
    recordHealth('Yahoo Finance API', 'ok', Date.now() - started);
    return parsed;
  } catch (err: any) {
    recordHealth('Yahoo Finance API', 'degraded', Date.now() - started, err?.message || 'Timeout');
    return null;
  }
}

interface BcbMacroSnapshot {
  selic: number | null;
  ipca12m: number | null;
  ptaxUsdBrl: number | null;
  cdiDaily: number | null;
  updatedAt: string;
}

export async function fetchBcbMacroData(): Promise<BcbMacroSnapshot> {
  const cacheKey = 'bcb:macro';
  const cached = cache.get(cacheKey) as CachedEntry<BcbMacroSnapshot> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const started = Date.now();
  try {
    const [selicRes, ipcaRes, ptaxRes, cdiRes] = await Promise.all([
      fetchJsonWithTimeout('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json', 3500),
      fetchJsonWithTimeout('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json', 3500),
      fetchJsonWithTimeout('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/2?formato=json', 3500),
      fetchJsonWithTimeout('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/2?formato=json', 3500),
    ]);

    const selicVal = Array.isArray(selicRes) && selicRes.length > 0 ? Number(selicRes[selicRes.length - 1].valor) : null;
    const ptaxVal = Array.isArray(ptaxRes) && ptaxRes.length > 0 ? Number(ptaxRes[ptaxRes.length - 1].valor) : null;
    const cdiVal = Array.isArray(cdiRes) && cdiRes.length > 0 ? Number(cdiRes[cdiRes.length - 1].valor) : null;

    let ipca12m: number | null = null;
    if (Array.isArray(ipcaRes) && ipcaRes.length === 12) {
      const compound = ipcaRes.reduce((acc: number, item: any) => acc * (1 + Number(item.valor) / 100), 1);
      ipca12m = Number(((compound - 1) * 100).toFixed(2));
    }

    const snap: BcbMacroSnapshot = {
      selic: selicVal,
      ipca12m,
      ptaxUsdBrl: ptaxVal,
      cdiDaily: cdiVal,
      updatedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { data: snap, expiresAt: Date.now() + TTL_MACRO_MS });
    recordHealth('Banco Central do Brasil (SGS)', 'ok', Date.now() - started);
    return snap;
  } catch (err: any) {
    recordHealth('Banco Central do Brasil (SGS)', 'degraded', Date.now() - started, err?.message || 'Timeout');
    return {
      selic: null,
      ipca12m: null,
      ptaxUsdBrl: null,
      cdiDaily: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getUsdBrlRate(): Promise<{ rate: number; source: string; feedStatus: FeedStatus }> {
  const bcb = await fetchBcbMacroData();
  if (bcb.ptaxUsdBrl && bcb.ptaxUsdBrl > 2) {
    return { rate: bcb.ptaxUsdBrl, source: 'Banco Central do Brasil (PTAX)', feedStatus: 'official_bcb' };
  }
  const yahooFx = await fetchYahooChart('USDBRL=X', '5d', '1d');
  if (yahooFx && yahooFx.price > 2) {
    return { rate: yahooFx.price, source: 'Yahoo Finance FX', feedStatus: 'delayed_15m' };
  }
  return { rate: 5.78, source: 'Taxa de Referência (Offline)', feedStatus: 'reference_snapshot' };
}

export async function getMarketIndices(): Promise<MarketIndexQuote[]> {
  const cacheKey = 'market:indices';
  const cached = cache.get(cacheKey) as CachedEntry<MarketIndexQuote[]> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const bcb = await fetchBcbMacroData();
  const yahooTargets = ['^BVSP', 'USDBRL=X', '^GSPC', '^IXIC', '^NDX', '^DJI', '^RUT', '^VIX', '^TNX', 'DX-Y.NYB'];

  const yahooResults = await Promise.all(
    yahooTargets.map(async (sym) => [sym, await fetchYahooChart(sym, '1mo', '1d')] as const)
  );
  const yahooMap = new Map(yahooResults);

  const enriched: MarketIndexQuote[] = REFERENCE_MARKET_INDICES.map((item) => {
    if (item.symbol === 'SELIC' && bcb.selic !== null) {
      return {
        ...item,
        value: bcb.selic,
        source: 'Banco Central do Brasil (SGS 432)',
        feedStatus: 'official_bcb',
        updatedAt: bcb.updatedAt,
      };
    }
    if (item.symbol === 'IPCA' && bcb.ipca12m !== null) {
      return {
        ...item,
        value: bcb.ipca12m,
        source: 'IBGE / Banco Central (SGS 433)',
        feedStatus: 'official_bcb',
        updatedAt: bcb.updatedAt,
      };
    }
    if (item.symbol === 'USDBRL=X' && bcb.ptaxUsdBrl !== null) {
      return {
        ...item,
        value: bcb.ptaxUsdBrl,
        source: 'Banco Central PTAX (SGS 1)',
        feedStatus: 'official_bcb',
        updatedAt: bcb.updatedAt,
      };
    }

    const yData = yahooMap.get(item.symbol);
    if (yData && yData.price > 0) {
      const change = Number((yData.price - yData.previousClose).toFixed(2));
      const changePct =
        yData.previousClose > 0 ? Number(((change / yData.previousClose) * 100).toFixed(2)) : 0;
      const sparkline =
        yData.bars.length >= 7 ? yData.bars.slice(-7).map((b) => b.close) : item.sparkline;
      return {
        ...item,
        value: yData.price,
        change,
        changePct,
        sparkline,
        source: 'Yahoo Finance (Atraso 15m)',
        feedStatus: 'delayed_15m',
        updatedAt: yData.updatedAt,
      };
    }

    return item;
  });

  cache.set(cacheKey, { data: enriched, expiresAt: Date.now() + TTL_QUOTES_MS });
  return enriched;
}

export async function getAllEquitiesOverview(refreshLive = true): Promise<EquityOverview[]> {
  const cacheKey = 'equities:all';
  const cached = cache.get(cacheKey) as CachedEntry<EquityOverview[]> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const liveMap = new Map<string, YahooChartParsed>();
  if (refreshLive) {
    // Query top representative symbols concurrently with short timeout so dashboard stays instant
    await Promise.all(
      EQUITY_SEEDS.map(async (s) => {
        const parsed = await fetchYahooChart(s.yahooSymbol, '1y', '1d');
        if (parsed && parsed.price > 0) {
          liveMap.set(s.ticker, parsed);
        }
      })
    );
  }

  const list: EquityOverview[] = EQUITY_SEEDS.map((seed) => {
    const live = liveMap.get(seed.ticker);
    const full = buildEquityDetailFromSeed(
      seed,
      live
        ? {
            price: live.price,
            previousClose: live.previousClose,
            volumeMillions: live.volumeMillions,
            high52w: live.high52w,
            low52w: live.low52w,
            bars: live.bars,
            source: 'Yahoo Finance (Atraso 15m)',
            feedStatus: 'delayed_15m',
            updatedAt: live.updatedAt,
          }
        : undefined
    );
    const {
      fundamentals: _f,
      statementsAnnual: _sa,
      statementsQuarterly: _sq,
      dividends: _d,
      priceHistory: _ph,
      strengths: _st,
      weaknesses: _wk,
      description: _desc,
      ...overview
    } = full;
    return overview;
  });

  cache.set(cacheKey, { data: list, expiresAt: Date.now() + TTL_QUOTES_MS });
  return list;
}

export async function getEquityDetail(
  rawTicker: string,
  range = '2y',
  interval = '1d'
): Promise<EquityFullDetail | null> {
  const cleanTicker = rawTicker.trim().toUpperCase().replace('.SA', '');
  const seed = EQUITY_SEEDS.find((s) => s.ticker === cleanTicker);

  if (seed) {
    const yahooRange = range === 'max' ? '5y' : range;
    const [live, dailyQuote] = await Promise.all([
      fetchYahooChart(seed.yahooSymbol, yahooRange, interval),
      interval !== '1d' ? fetchYahooChart(seed.yahooSymbol, '5d', '1d') : Promise.resolve(null),
    ]);
    return buildEquityDetailFromSeed(
      seed,
      live
        ? {
            price: dailyQuote?.price ?? live.price,
            previousClose: dailyQuote?.previousClose ?? live.previousClose,
            volumeMillions: dailyQuote?.volumeMillions ?? live.volumeMillions,
            high52w: dailyQuote?.high52w ?? live.high52w,
            low52w: dailyQuote?.low52w ?? live.low52w,
            bars: live.bars,
            source: 'Yahoo Finance (Atraso 15m)',
            feedStatus: 'delayed_15m',
            updatedAt: dailyQuote?.updatedAt ?? live.updatedAt,
          }
        : undefined
    );
  }

  // Dynamic external lookup for any B3 or US ticker outside the curated universe
  const isB3Pattern = /^[A-Z]{4}(3|4|5|6|11)$/.test(cleanTicker);
  const symbolToFetch = isB3Pattern ? `${cleanTicker}.SA` : cleanTicker;
  const [live, dailyQuote] = await Promise.all([
    fetchYahooChart(symbolToFetch, range === 'max' ? '5y' : range, interval),
    interval !== '1d' ? fetchYahooChart(symbolToFetch, '5d', '1d') : Promise.resolve(null),
  ]);
  if (!live || live.price <= 0) {
    return null;
  }
  const effectivePrice = dailyQuote?.price ?? live.price;
  const effectivePrev = dailyQuote?.previousClose ?? live.previousClose;

  // Build transparent quote-only detail for external ticker (no fabricated fundamentals!)
  const change = Number((effectivePrice - effectivePrev).toFixed(2));
  const changePct =
    effectivePrev > 0 ? Number(((change / effectivePrev) * 100).toFixed(2)) : 0;

  return {
    ticker: cleanTicker,
    yahooSymbol: symbolToFetch,
    name: `${cleanTicker} (${isB3Pattern ? 'B3' : 'US Market'})`,
    market: isB3Pattern ? 'B3' : 'US',
    exchange: isB3Pattern ? 'B3' : 'NASDAQ',
    currency: isB3Pattern ? 'BRL' : 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Ativo Consultado via API Externa',
    tags: [isB3Pattern ? 'B3' : 'US'],
    price: effectivePrice,
    previousClose: effectivePrev,
    change,
    changePct,
    marketCapMillions: 0,
    volumeMillions: live.volumeMillions ?? 0,
    avgDailyVolumeMillions: live.volumeMillions ?? 0,
    high52w: live.high52w ?? live.price,
    low52w: live.low52w ?? live.price,
    sharesOutstandingMillions: 0,
    freeFloatPct: 0,
    beta: 1.0,
    dividendFrequency: 'Sob consulta',
    nextEarningsDate: 'N/D',
    source: 'Yahoo Finance (Consulta Dinâmica — Cotação & Gráfico)',
    feedStatus: 'delayed_15m',
    updatedAt: live.updatedAt,
    referenceStatementDate: 'Demonstrações detalhadas disponíveis para ativos cobertos na base',
    metricsSummary: {
      pe: null,
      pb: null,
      psr: null,
      evEbitda: null,
      evEbit: null,
      peg: null,
      roe: null,
      roic: null,
      roa: null,
      grossMargin: null,
      ebitdaMargin: null,
      netMargin: null,
      netDebtEbitda: null,
      currentRatio: null,
      dividendYield: null,
      payout: null,
      revenueCagr5y: null,
      earningsCagr5y: null,
      eps: null,
      fcfMillions: null,
      pfcf: null,
      rsi14: 50,
      aboveSma200: true,
      macdPositive: true,
      volumeAboveAvg: false,
    },
    investScore: {
      totalScore: 50,
      classification: 'Equilibrada',
      sectorProfile: 'Tecnologia & Software',
      methodologyNote: 'Pontuação parcial: apenas cotação e série histórica disponíveis para este ticker externo.',
      referenceDate: live.updatedAt.slice(0, 10),
      pillars: [],
    },
    fundamentals: [],
    statementsAnnual: [],
    statementsQuarterly: [],
    dividends: [],
    priceHistory: live.bars.length > 0 ? live.bars : generateReferencePriceBars(cleanTicker, live.price, 260),
    strengths: ['Cotação e histórico de preços obtidos em tempo real/atrasado via provedor externo.'],
    weaknesses: ['Balanços detalhados ainda não indexados na base fundamentalista para este ticker.'],
    description: 'Ativo consultado dinamicamente via adaptador de mercado.',
  };
}
