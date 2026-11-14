import type {
  EquityOverview,
  InvestScoreBreakdown,
  PriceBar,
  SectorProfile,
} from './types.ts';

// Deterministic Technical Indicators

export function calculateSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, idx) => {
    if (idx < period - 1) return null;
    let sum = 0;
    for (let i = idx - period + 1; i <= idx; i++) {
      sum += values[i];
    }
    return Number((sum / period).toFixed(4));
  });
}

export function calculateEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return result;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  result[period - 1] = Number(ema.toFixed(4));
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result[i] = Number(ema.toFixed(4));
  }
  return result;
}

export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] =
    avgLoss === 0 ? 100 : Number((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] =
      avgLoss === 0 ? 100 : Number((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  }
  return result;
}

export function calculateMACD(closes: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdRaw: (number | null)[] = closes.map((_, i) => {
    const a = ema12[i];
    const b = ema26[i];
    return a !== null && b !== null ? Number((a - b).toFixed(4)) : null;
  });

  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  macdRaw.forEach((v, idx) => {
    if (v !== null) {
      validMacdValues.push(v);
      validIndices.push(idx);
    }
  });

  const signalValid = calculateEMA(validMacdValues, 9);
  const signal: (number | null)[] = new Array(closes.length).fill(null);
  const histogram: (number | null)[] = new Array(closes.length).fill(null);

  validIndices.forEach((origIdx, k) => {
    const s = signalValid[k];
    const m = macdRaw[origIdx];
    signal[origIdx] = s;
    if (s !== null && m !== null) {
      histogram[origIdx] = Number((m - s).toFixed(4));
    }
  });

  return { macd: macdRaw, signal, histogram };
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdMult = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;
    let sqDiffSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sqDiffSum += Math.pow(closes[j] - mean, 2);
    }
    const std = Math.sqrt(sqDiffSum / period);
    upper[i] = Number((mean + stdMult * std).toFixed(4));
    lower[i] = Number((mean - stdMult * std).toFixed(4));
  }

  return { upper, middle, lower };
}

export function calculateVWAP(bars: PriceBar[]): number[] {
  let cumulativePV = 0;
  let cumulativeVol = 0;
  return bars.map((b) => {
    const typical = (b.high + b.low + b.close) / 3;
    cumulativePV += typical * b.volume;
    cumulativeVol += b.volume;
    return cumulativeVol > 0 ? Number((cumulativePV / cumulativeVol).toFixed(4)) : b.close;
  });
}

export function calculateFibonacciRetracement(bars: PriceBar[]) {
  if (bars.length === 0) return [];
  let maxHigh = -Infinity;
  let minLow = Infinity;
  for (const b of bars) {
    if (b.high > maxHigh) maxHigh = b.high;
    if (b.low < minLow) minLow = b.low;
  }
  const diff = maxHigh - minLow;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  return levels.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: Number((maxHigh - diff * ratio).toFixed(2)),
  }));
}

export function detectSupportResistance(bars: PriceBar[]) {
  if (bars.length < 20) return { supports: [], resistances: [] };
  const recent = bars.slice(-90);
  const lows = recent.map((b) => b.low).sort((a, b) => a - b);
  const highs = recent.map((b) => b.high).sort((a, b) => b - a);
  const s1 = Number(lows[Math.floor(lows.length * 0.08)].toFixed(2));
  const s2 = Number(lows[Math.floor(lows.length * 0.22)].toFixed(2));
  const r1 = Number(highs[Math.floor(highs.length * 0.08)].toFixed(2));
  const r2 = Number(highs[Math.floor(highs.length * 0.22)].toFixed(2));
  return {
    supports: Array.from(new Set([s1, s2])).sort((a, b) => a - b),
    resistances: Array.from(new Set([r2, r1])).sort((a, b) => a - b),
  };
}

// Proprietary Sector-Adjusted INVEST SCORE Engine

const SECTOR_WEIGHTS: Record<
  SectorProfile,
  {
    growth: number;
    profitability: number;
    financialHealth: number;
    competitiveAdvantage: number;
    valuation: number;
    cashGeneration: number;
    risk: number;
    note: string;
  }
> = {
  'Bancos & Financeiro': {
    growth: 12,
    profitability: 24,
    financialHealth: 18,
    competitiveAdvantage: 14,
    valuation: 20,
    cashGeneration: 4,
    risk: 8,
    note: 'Metodologia bancária: prioriza ROE, P/VP, eficiência e retorno ao acionista; desconsidera EV/EBITDA e liquidez corrente.',
  },
  'Tecnologia & Software': {
    growth: 24,
    profitability: 18,
    financialHealth: 12,
    competitiveAdvantage: 16,
    valuation: 12,
    cashGeneration: 12,
    risk: 6,
    note: 'Metodologia Tech: maior peso para CAGR de receita/lucro, vantagem competitiva (ROIC/margem bruta) e geração de FCF.',
  },
  'Semicondutores & IA': {
    growth: 25,
    profitability: 20,
    financialHealth: 12,
    competitiveAdvantage: 16,
    valuation: 10,
    cashGeneration: 11,
    risk: 6,
    note: 'Metodologia Semicondutores: enfatiza aceleração de receita, margens operacionais de escala, P&D e solidez de caixa líquido.',
  },
  'Energia & Commodities': {
    growth: 8,
    profitability: 16,
    financialHealth: 20,
    competitiveAdvantage: 10,
    valuation: 20,
    cashGeneration: 18,
    risk: 8,
    note: 'Metodologia Commodities: prioriza geração de FCF no ciclo, baixa alavancagem (Dív. Líq./EBITDA) e desconto de múltiplos EV/EBITDA.',
  },
  'Indústria & Bens de Capital': {
    growth: 16,
    profitability: 18,
    financialHealth: 16,
    competitiveAdvantage: 14,
    valuation: 14,
    cashGeneration: 14,
    risk: 8,
    note: 'Metodologia Industrial: equilibra ROIC, expansão de margens, conversão de caixa operacional e disciplina de endividamento.',
  },
  'Consumo & Varejo': {
    growth: 16,
    profitability: 16,
    financialHealth: 18,
    competitiveAdvantage: 14,
    valuation: 16,
    cashGeneration: 12,
    risk: 8,
    note: 'Metodologia Consumo: foca em resiliência de margem bruta, liquidez corrente, giro e controle de dívida líquida.',
  },
  'Saúde & Biotecnologia': {
    growth: 18,
    profitability: 18,
    financialHealth: 15,
    competitiveAdvantage: 15,
    valuation: 14,
    cashGeneration: 12,
    risk: 8,
    note: 'Metodologia Saúde: avalia poder de marca/patentes (margem bruta), ROIC sustentado e FCF para financiar pipeline.',
  },
  'Utilidade Pública & Saneamento': {
    growth: 8,
    profitability: 16,
    financialHealth: 20,
    competitiveAdvantage: 14,
    valuation: 18,
    cashGeneration: 14,
    risk: 10,
    note: 'Metodologia Utilities: prioriza previsibilidade de fluxo de caixa, dividend yield sustentável e estrutura de dívida.',
  },
  'Cibersegurança & Cloud': {
    growth: 24,
    profitability: 16,
    financialHealth: 14,
    competitiveAdvantage: 16,
    valuation: 10,
    cashGeneration: 14,
    risk: 6,
    note: 'Metodologia Cloud & Security: valoriza crescimento composto, margem bruta recorrente e Rule of 40 (crescimento + margem FCF).',
  },
};

function clampScore(val: number): number {
  return Math.max(5, Math.min(98, Math.round(val)));
}

export function calculateInvestScore(input: {
  sector: SectorProfile;
  market: 'B3' | 'US';
  beta: number;
  pe: number | null;
  pb: number | null;
  evEbitda: number | null;
  roe: number | null;
  roic: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  netDebtEbitda: number | null;
  currentRatio: number | null;
  dividendYield: number | null;
  revenueCagr5y: number | null;
  earningsCagr5y: number | null;
  fcfMillions: number | null;
  marketCapMillions: number;
  referenceDate: string;
}): InvestScoreBreakdown {
  const weights = SECTOR_WEIGHTS[input.sector];
  const isBank = input.sector === 'Bancos & Financeiro';

  // 1. Growth
  const revG = input.revenueCagr5y ?? 5;
  const earnG = input.earningsCagr5y ?? 5;
  const growthScore = clampScore(40 + revG * 1.4 + earnG * 1.1);

  // 2. Profitability
  const roe = input.roe ?? 12;
  const roic = input.roic ?? roe;
  const netM = input.netMargin ?? 10;
  const profitabilityScore = isBank
    ? clampScore(30 + roe * 2.5 + netM * 0.7)
    : clampScore(25 + roe * 1.1 + roic * 1.2 + netM * 0.8);

  // 3. Financial Health
  let healthScore = 70;
  if (isBank) {
    healthScore = clampScore(68 + (roe > 15 ? 16 : 6) + (netM > 15 ? 8 : 0));
  } else {
    const nd = input.netDebtEbitda ?? 1.0;
    const liq = input.currentRatio ?? 1.4;
    const debtPenalty = nd < 0 ? 18 : Math.max(-35, (1.5 - nd) * 14);
    const liqBonus = Math.min(18, (liq - 1) * 14);
    healthScore = clampScore(62 + debtPenalty + liqBonus);
  }

  // 4. Competitive Advantage
  const gm = input.grossMargin ?? (isBank ? 45 : 35);
  const compScore = clampScore(32 + gm * 0.65 + (roic > 18 ? 18 : roic * 0.8));

  // 5. Valuation (region-calibrated: B3 typically trades at lower multiples than US tech)
  const fairPe = input.market === 'B3' ? 11 : 24;
  const peVal = input.pe && input.pe > 0 ? input.pe : fairPe * 1.4;
  let valScore = 55 + ((fairPe - peVal) / fairPe) * 32;
  if (isBank && input.pb) {
    valScore = 62 + (1.6 - input.pb) * 28;
  } else if (input.evEbitda && input.evEbitda > 0) {
    const fairEv = input.market === 'B3' ? 7.5 : 16;
    valScore = (valScore + (55 + ((fairEv - input.evEbitda) / fairEv) * 30)) / 2;
  }
  const dyBonus = input.dividendYield ? Math.min(12, input.dividendYield * 1.3) : 0;
  const valuationScore = clampScore(valScore + dyBonus);

  // 6. Cash Generation
  let cashScore = 65;
  if (!isBank && input.fcfMillions !== null && input.marketCapMillions > 0) {
    const fcfYield = (input.fcfMillions / input.marketCapMillions) * 100;
    cashScore = clampScore(42 + fcfYield * 6.5);
  } else if (isBank) {
    cashScore = clampScore(55 + (input.dividendYield ?? 4) * 4);
  }

  // 7. Risk (inverse of volatility/leverage)
  const betaPenalty = (input.beta - 1) * 18;
  const leveragePenalty = !isBank && (input.netDebtEbitda ?? 0) > 2.5 ? 16 : 0;
  const riskScore = clampScore(82 - betaPenalty - leveragePenalty);

  const pillars: InvestScoreBreakdown['pillars'] = [
    {
      key: 'growth',
      label: 'Crescimento',
      score: growthScore,
      weightPct: weights.growth,
      weightedContribution: Number(((growthScore * weights.growth) / 100).toFixed(2)),
      rationale: `CAGR Receita 5a: ${revG.toFixed(1)}% · CAGR Lucro 5a: ${earnG.toFixed(1)}%`,
    },
    {
      key: 'profitability',
      label: 'Rentabilidade',
      score: profitabilityScore,
      weightPct: weights.profitability,
      weightedContribution: Number(
        ((profitabilityScore * weights.profitability) / 100).toFixed(2)
      ),
      rationale: isBank
        ? `ROE: ${roe.toFixed(1)}% · Margem Líquida: ${netM.toFixed(1)}%`
        : `ROE: ${roe.toFixed(1)}% · ROIC: ${roic.toFixed(1)}%`,
    },
    {
      key: 'financialHealth',
      label: 'Saúde Financeira',
      score: healthScore,
      weightPct: weights.financialHealth,
      weightedContribution: Number(
        ((healthScore * weights.financialHealth) / 100).toFixed(2)
      ),
      rationale: isBank
        ? 'Estrutura de capital bancária avaliada via retorno e margem líquida.'
        : `Dív. Líq./EBITDA: ${(input.netDebtEbitda ?? 0).toFixed(2)}x · Liq. Corrente: ${(input.currentRatio ?? 0).toFixed(2)}x`,
    },
    {
      key: 'competitiveAdvantage',
      label: 'Vantagem Competitiva',
      score: compScore,
      weightPct: weights.competitiveAdvantage,
      weightedContribution: Number(
        ((compScore * weights.competitiveAdvantage) / 100).toFixed(2)
      ),
      rationale: `Poder de precificação e fosso econômico (Margem Bruta: ${gm.toFixed(1)}%)`,
    },
    {
      key: 'valuation',
      label: 'Valuation',
      score: valuationScore,
      weightPct: weights.valuation,
      weightedContribution: Number(((valuationScore * weights.valuation) / 100).toFixed(2)),
      rationale: isBank
        ? `P/VP: ${(input.pb ?? 0).toFixed(2)}x · P/L: ${(input.pe ?? 0).toFixed(1)}x`
        : `P/L: ${(input.pe ?? 0).toFixed(1)}x · EV/EBITDA: ${(input.evEbitda ?? 0).toFixed(1)}x`,
    },
    {
      key: 'cashGeneration',
      label: 'Geração de Caixa',
      score: cashScore,
      weightPct: weights.cashGeneration,
      weightedContribution: Number(
        ((cashScore * weights.cashGeneration) / 100).toFixed(2)
      ),
      rationale: isBank
        ? `Capacidade de remuneração ao acionista (DY: ${(input.dividendYield ?? 0).toFixed(1)}%)`
        : `FCF Yield: ${
            input.fcfMillions && input.marketCapMillions
              ? ((input.fcfMillions / input.marketCapMillions) * 100).toFixed(2)
              : '0.00'
          }%`,
    },
    {
      key: 'risk',
      label: 'Controle de Risco',
      score: riskScore,
      weightPct: weights.risk,
      weightedContribution: Number(((riskScore * weights.risk) / 100).toFixed(2)),
      rationale: `Beta de mercado: ${input.beta.toFixed(2)} · Estabilidade de balanço`,
    },
  ];

  const totalScore = Math.round(
    pillars.reduce((acc, p) => acc + p.weightedContribution, 0)
  );

  let classification: InvestScoreBreakdown['classification'] = 'Equilibrada';
  if (totalScore >= 82) classification = 'Excelente';
  else if (totalScore >= 70) classification = 'Forte';
  else if (totalScore >= 55) classification = 'Equilibrada';
  else if (totalScore >= 42) classification = 'Atenção';
  else classification = 'Elevado Risco';

  return {
    totalScore,
    classification,
    sectorProfile: input.sector,
    methodologyNote: weights.note,
    referenceDate: input.referenceDate,
    pillars,
  };
}

// Valuation Calculators

export interface DCFInput {
  currentPrice: number;
  sharesOutstandingMillions: number;
  baseRevenueMillions: number;
  operatingMarginPct: number;
  taxRatePct: number;
  fcfConversionPct: number; // FCF as % of NOPAT
  revenueGrowthPct: number;
  waccPct: number;
  perpetuityGrowthPct: number;
  netDebtMillions: number;
  projectionYears: number;
}

export interface DCFResult {
  fairValuePerShare: number;
  currentPrice: number;
  upsidePct: number;
  marginOfSafetyPct: number;
  enterpriseValueMillions: number;
  equityValueMillions: number;
  pvProjectedFcfMillions: number;
  pvTerminalValueMillions: number;
  yearlyProjections: {
    year: number;
    revenue: number;
    ebit: number;
    fcf: number;
    discountedFcf: number;
  }[];
  scenarios: {
    pessimistic: number;
    base: number;
    optimistic: number;
  };
}

export function calculateDCF(input: DCFInput): DCFResult {
  const wacc = Math.max(0.04, input.waccPct / 100);
  const gPerp = Math.min(wacc - 0.015, input.perpetuityGrowthPct / 100);
  const growth = input.revenueGrowthPct / 100;
  const opMargin = input.operatingMarginPct / 100;
  const tax = input.taxRatePct / 100;
  const conv = input.fcfConversionPct / 100;

  const yearlyProjections: DCFResult['yearlyProjections'] = [];
  let rev = input.baseRevenueMillions;
  let pvProjectedFcfMillions = 0;
  let lastFcf = 0;

  for (let yr = 1; yr <= input.projectionYears; yr++) {
    // Gradual fade of high growth toward perpetuity in later years
    const fadeFactor = Math.max(0.55, 1 - (yr - 1) * 0.05);
    const yrGrowth = gPerp + (growth - gPerp) * fadeFactor;
    rev = rev * (1 + yrGrowth);
    const ebit = rev * opMargin;
    const nopat = ebit * (1 - tax);
    const fcf = nopat * conv;
    const discountedFcf = fcf / Math.pow(1 + wacc, yr);
    pvProjectedFcfMillions += discountedFcf;
    lastFcf = fcf;
    yearlyProjections.push({
      year: yr,
      revenue: Number(rev.toFixed(1)),
      ebit: Number(ebit.toFixed(1)),
      fcf: Number(fcf.toFixed(1)),
      discountedFcf: Number(discountedFcf.toFixed(1)),
    });
  }

  const terminalValue = (lastFcf * (1 + gPerp)) / Math.max(0.015, wacc - gPerp);
  const pvTerminalValueMillions =
    terminalValue / Math.pow(1 + wacc, input.projectionYears);
  const enterpriseValueMillions = pvProjectedFcfMillions + pvTerminalValueMillions;
  const equityValueMillions = Math.max(
    0,
    enterpriseValueMillions - input.netDebtMillions
  );
  const fairValuePerShare =
    input.sharesOutstandingMillions > 0
      ? Number((equityValueMillions / input.sharesOutstandingMillions).toFixed(2))
      : 0;

  const upsidePct =
    input.currentPrice > 0
      ? Number((((fairValuePerShare - input.currentPrice) / input.currentPrice) * 100).toFixed(2))
      : 0;
  const marginOfSafetyPct =
    fairValuePerShare > 0
      ? Number((((fairValuePerShare - input.currentPrice) / fairValuePerShare) * 100).toFixed(2))
      : 0;

  // Compute pessimistic (+1.5% WACC, -2.5% growth) & optimistic (-1% WACC, +2.5% growth)
  const pessInput: DCFInput = {
    ...input,
    waccPct: input.waccPct + 1.5,
    revenueGrowthPct: Math.max(0, input.revenueGrowthPct - 2.5),
    operatingMarginPct: Math.max(2, input.operatingMarginPct - 2),
  };
  const optInput: DCFInput = {
    ...input,
    waccPct: Math.max(5.5, input.waccPct - 1.0),
    revenueGrowthPct: input.revenueGrowthPct + 2.5,
    operatingMarginPct: input.operatingMarginPct + 1.5,
  };

  const runCore = (cfg: DCFInput) => {
    const w = Math.max(0.04, cfg.waccPct / 100);
    const gp = Math.min(w - 0.015, cfg.perpetuityGrowthPct / 100);
    const gr = cfg.revenueGrowthPct / 100;
    let r = cfg.baseRevenueMillions;
    let pv = 0;
    let lf = 0;
    for (let y = 1; y <= cfg.projectionYears; y++) {
      const ff = Math.max(0.55, 1 - (y - 1) * 0.05);
      r = r * (1 + gp + (gr - gp) * ff);
      const f = r * (cfg.operatingMarginPct / 100) * (1 - cfg.taxRatePct / 100) * (cfg.fcfConversionPct / 100);
      pv += f / Math.pow(1 + w, y);
      lf = f;
    }
    const tv = (lf * (1 + gp)) / Math.max(0.015, w - gp);
    const eq = Math.max(0, pv + tv / Math.pow(1 + w, cfg.projectionYears) - cfg.netDebtMillions);
    return cfg.sharesOutstandingMillions > 0
      ? Number((eq / cfg.sharesOutstandingMillions).toFixed(2))
      : 0;
  };

  return {
    fairValuePerShare,
    currentPrice: input.currentPrice,
    upsidePct,
    marginOfSafetyPct,
    enterpriseValueMillions: Number(enterpriseValueMillions.toFixed(1)),
    equityValueMillions: Number(equityValueMillions.toFixed(1)),
    pvProjectedFcfMillions: Number(pvProjectedFcfMillions.toFixed(1)),
    pvTerminalValueMillions: Number(pvTerminalValueMillions.toFixed(1)),
    yearlyProjections,
    scenarios: {
      pessimistic: runCore(pessInput),
      base: fairValuePerShare,
      optimistic: runCore(optInput),
    },
  };
}

export function calculateDCFSensitivityMatrix(input: DCFInput) {
  const waccSteps = [-1.5, -0.75, 0, 0.75, 1.5].map((d) =>
    Number(Math.max(5.5, input.waccPct + d).toFixed(2))
  );
  const perpSteps = [-1.0, -0.5, 0, 0.5, 1.0].map((d) =>
    Number(Math.max(1.0, input.perpetuityGrowthPct + d).toFixed(2))
  );

  const matrix = waccSteps.map((wacc) => ({
    wacc,
    cells: perpSteps.map((perp) => {
      const res = calculateDCF({
        ...input,
        waccPct: wacc,
        perpetuityGrowthPct: Math.min(wacc - 1.5, perp),
      });
      return {
        perp,
        fairValue: res.fairValuePerShare,
        upsidePct: res.upsidePct,
      };
    }),
  }));

  return { waccSteps, perpSteps, matrix };
}

export function calculateGordonGrowth(input: {
  annualDividendPerShare: number;
  dividendGrowthPct: number;
  requiredReturnPct: number;
  currentPrice: number;
}) {
  const k = input.requiredReturnPct / 100;
  const g = Math.min(k - 0.015, input.dividendGrowthPct / 100);
  const d1 = input.annualDividendPerShare * (1 + g);
  const fairValue = Number((d1 / Math.max(0.015, k - g)).toFixed(2));
  const upsidePct =
    input.currentPrice > 0
      ? Number((((fairValue - input.currentPrice) / input.currentPrice) * 100).toFixed(2))
      : 0;
  return { fairValue, d1: Number(d1.toFixed(2)), upsidePct };
}

// Passive Income & Dividend Tax Simulator

export interface PassiveIncomeInput {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  annualDividendYieldPct: number;
  annualPriceAppreciationPct: number;
  annualDividendGrowthPct: number;
  reinvestDividends: boolean;
  taxProfile: 'BR_DIVIDEND_ISENTO' | 'BR_JCP_15' | 'US_DIVIDEND_30';
}

export function simulatePassiveIncome(input: PassiveIncomeInput) {
  const taxRate =
    input.taxProfile === 'BR_DIVIDEND_ISENTO'
      ? 0
      : input.taxProfile === 'BR_JCP_15'
      ? 0.15
      : 0.3;

  const monthlyAppreciation = Math.pow(1 + input.annualPriceAppreciationPct / 100, 1 / 12) - 1;
  let balance = input.initialInvestment;
  let totalContributed = input.initialInvestment;
  let totalGrossDividends = 0;
  let totalTaxesPaid = 0;

  const timeline: {
    year: number;
    patrimony: number;
    contributed: number;
    annualGrossDividend: number;
    annualNetDividend: number;
    monthlyNetIncome: number;
  }[] = [];

  for (let yr = 1; yr <= input.years; yr++) {
    const effectiveYield =
      (input.annualDividendYieldPct / 100) *
      Math.pow(1 + input.annualDividendGrowthPct / 100, yr - 1);
    let yrGrossDiv = 0;
    let yrTax = 0;

    for (let m = 1; m <= 12; m++) {
      balance = balance * (1 + monthlyAppreciation) + input.monthlyContribution;
      totalContributed += input.monthlyContribution;
      const monthGrossDiv = balance * (effectiveYield / 12);
      const monthTax = monthGrossDiv * taxRate;
      const monthNetDiv = monthGrossDiv - monthTax;

      yrGrossDiv += monthGrossDiv;
      yrTax += monthTax;
      totalGrossDividends += monthGrossDiv;
      totalTaxesPaid += monthTax;

      if (input.reinvestDividends) {
        balance += monthNetDiv;
      }
    }

    const yrNetDiv = yrGrossDiv - yrTax;
    timeline.push({
      year: yr,
      patrimony: Number(balance.toFixed(2)),
      contributed: Number(totalContributed.toFixed(2)),
      annualGrossDividend: Number(yrGrossDiv.toFixed(2)),
      annualNetDividend: Number(yrNetDiv.toFixed(2)),
      monthlyNetIncome: Number((yrNetDiv / 12).toFixed(2)),
    });
  }

  const last = timeline[timeline.length - 1];
  return {
    taxRatePct: taxRate * 100,
    finalPatrimony: last?.patrimony ?? input.initialInvestment,
    totalContributed: Number(totalContributed.toFixed(2)),
    totalGrossDividends: Number(totalGrossDividends.toFixed(2)),
    totalTaxesPaid: Number(totalTaxesPaid.toFixed(2)),
    totalNetDividends: Number((totalGrossDividends - totalTaxesPaid).toFixed(2)),
    finalMonthlyNetIncome: last?.monthlyNetIncome ?? 0,
    timeline,
  };
}

// Portfolio Analytics Engine

export interface RawPortfolioTx {
  id: number;
  ticker: string;
  market: string;
  type: string;
  quantity: number;
  price: number;
  currency: string;
  fees: number;
  executedAt: string;
}

export function calculatePortfolioAnalytics(
  transactions: RawPortfolioTx[],
  equitiesByTicker: Map<string, EquityOverview>,
  usdBrlRate: number
) {
  interface HoldingAcc {
    ticker: string;
    market: string;
    currency: string;
    quantity: number;
    totalCostNative: number;
    realizedPnlNative: number;
    dividendsNative: number;
  }

  const map = new Map<string, HoldingAcc>();
  const chronological = [...transactions].sort((a, b) =>
    a.executedAt.localeCompare(b.executedAt)
  );

  for (const tx of chronological) {
    const key = tx.ticker.toUpperCase();
    const acc: HoldingAcc = map.get(key) ?? {
      ticker: key,
      market: tx.market,
      currency: tx.currency,
      quantity: 0,
      totalCostNative: 0,
      realizedPnlNative: 0,
      dividendsNative: 0,
    };

    if (tx.type === 'BUY') {
      acc.quantity += tx.quantity;
      acc.totalCostNative += tx.quantity * tx.price + tx.fees;
    } else if (tx.type === 'SELL') {
      if (acc.quantity > 0) {
        const avgCost = acc.totalCostNative / acc.quantity;
        const sellQty = Math.min(tx.quantity, acc.quantity);
        acc.realizedPnlNative += sellQty * tx.price - tx.fees - sellQty * avgCost;
        acc.quantity -= sellQty;
        acc.totalCostNative = acc.quantity * avgCost;
      }
    } else if (tx.type === 'DIVIDEND') {
      acc.dividendsNative += tx.quantity * tx.price - tx.fees;
    }
    map.set(key, acc);
  }

  let totalValueBrl = 0;
  let totalCostBrl = 0;
  let totalRealizedBrl = 0;
  let totalDividendsBrl = 0;

  const positions: {
    ticker: string;
    name: string;
    market: string;
    sector: string;
    currency: string;
    quantity: number;
    avgPriceNative: number;
    currentPriceNative: number;
    marketValueBrl: number;
    costBasisBrl: number;
    unrealizedPnlBrl: number;
    unrealizedPct: number;
    realizedPnlBrl: number;
    dividendsBrl: number;
    weightPct: number;
  }[] = [];

  for (const acc of map.values()) {
    const eq = equitiesByTicker.get(acc.ticker);
    const fx = acc.currency === 'USD' ? usdBrlRate : 1;
    const currentPrice = eq?.price ?? (acc.quantity > 0 ? acc.totalCostNative / acc.quantity : 0);
    const marketValueNative = acc.quantity * currentPrice;
    const marketValueBrl = marketValueNative * fx;
    const costBasisBrl = acc.totalCostNative * fx;
    const unrealizedPnlBrl = marketValueBrl - costBasisBrl;
    const realizedPnlBrl = acc.realizedPnlNative * fx;
    const dividendsBrl = acc.dividendsNative * fx;

    totalValueBrl += marketValueBrl;
    totalCostBrl += costBasisBrl;
    totalRealizedBrl += realizedPnlBrl;
    totalDividendsBrl += dividendsBrl;

    if (acc.quantity > 0 || realizedPnlBrl !== 0 || dividendsBrl !== 0) {
      positions.push({
        ticker: acc.ticker,
        name: eq?.name ?? acc.ticker,
        market: acc.market,
        sector: eq?.sector ?? 'Outros',
        currency: acc.currency,
        quantity: Number(acc.quantity.toFixed(4)),
        avgPriceNative:
          acc.quantity > 0 ? Number((acc.totalCostNative / acc.quantity).toFixed(2)) : 0,
        currentPriceNative: Number(currentPrice.toFixed(2)),
        marketValueBrl: Number(marketValueBrl.toFixed(2)),
        costBasisBrl: Number(costBasisBrl.toFixed(2)),
        unrealizedPnlBrl: Number(unrealizedPnlBrl.toFixed(2)),
        unrealizedPct:
          costBasisBrl > 0
            ? Number(((unrealizedPnlBrl / costBasisBrl) * 100).toFixed(2))
            : 0,
        realizedPnlBrl: Number(realizedPnlBrl.toFixed(2)),
        dividendsBrl: Number(dividendsBrl.toFixed(2)),
        weightPct: 0,
      });
    }
  }

  const sectorMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const currencyMap = new Map<string, number>();

  for (const p of positions) {
    p.weightPct =
      totalValueBrl > 0 ? Number(((p.marketValueBrl / totalValueBrl) * 100).toFixed(2)) : 0;
    sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.marketValueBrl);
    const country = p.market === 'B3' ? 'Brasil (B3)' : 'Estados Unidos (NYSE/NASDAQ)';
    countryMap.set(country, (countryMap.get(country) ?? 0) + p.marketValueBrl);
    currencyMap.set(p.currency, (currencyMap.get(p.currency) ?? 0) + p.marketValueBrl);
  }

  positions.sort((a, b) => b.marketValueBrl - a.marketValueBrl);

  const maxWeight = positions.reduce((m, p) => Math.max(m, p.weightPct), 0);
  const hhi = positions.reduce((acc, p) => acc + Math.pow(p.weightPct / 100, 2), 0);

  const totalUnrealizedBrl = totalValueBrl - totalCostBrl;
  const totalReturnPct =
    totalCostBrl > 0
      ? Number((((totalUnrealizedBrl + totalRealizedBrl + totalDividendsBrl) / totalCostBrl) * 100).toFixed(2))
      : 0;

  return {
    summary: {
      totalValueBrl: Number(totalValueBrl.toFixed(2)),
      totalValueUsd: Number((totalValueBrl / usdBrlRate).toFixed(2)),
      totalCostBrl: Number(totalCostBrl.toFixed(2)),
      unrealizedPnlBrl: Number(totalUnrealizedBrl.toFixed(2)),
      realizedPnlBrl: Number(totalRealizedBrl.toFixed(2)),
      dividendsBrl: Number(totalDividendsBrl.toFixed(2)),
      totalReturnPct,
      maxPositionWeightPct: maxWeight,
      concentrationAlert:
        maxWeight > 25
          ? `Concentração elevada: o maior ativo representa ${maxWeight.toFixed(1)}% da carteira (acima de 25%).`
          : hhi > 0.22 && positions.length > 0
          ? 'Índice Herfindahl indica carteira concentrada em poucos ativos.'
          : null,
    },
    positions,
    bySector: Array.from(sectorMap.entries()).map(([name, valueBrl]) => ({
      name,
      valueBrl: Number(valueBrl.toFixed(2)),
      pct: totalValueBrl > 0 ? Number(((valueBrl / totalValueBrl) * 100).toFixed(1)) : 0,
    })),
    byCountry: Array.from(countryMap.entries()).map(([name, valueBrl]) => ({
      name,
      valueBrl: Number(valueBrl.toFixed(2)),
      pct: totalValueBrl > 0 ? Number(((valueBrl / totalValueBrl) * 100).toFixed(1)) : 0,
    })),
    byCurrency: Array.from(currencyMap.entries()).map(([name, valueBrl]) => ({
      name,
      valueBrl: Number(valueBrl.toFixed(2)),
      pct: totalValueBrl > 0 ? Number(((valueBrl / totalValueBrl) * 100).toFixed(1)) : 0,
    })),
  };
}
