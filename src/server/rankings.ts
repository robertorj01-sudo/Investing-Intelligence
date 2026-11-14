import { calculateDCF } from '../shared/financialEngine.ts';
import type { EquityOverview } from '../shared/types.ts';

export type RankingCategory =
  | 'growth'
  | 'dividends'
  | 'valuation'
  | 'roe'
  | 'roic'
  | 'earnings_growth'
  | 'revenue_growth'
  | 'cash_generation'
  | 'small_caps'
  | 'financial_health'
  | 'upside_potential';

export interface RankingEntry {
  rank: number;
  ticker: string;
  name: string;
  market: 'B3' | 'US';
  sector: string;
  price: number;
  currency: 'BRL' | 'USD';
  score: number;
  investScore: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetrics: { label: string; value: string }[];
  criteriaNote: string;
  referenceDate: string;
}

export const RANKING_CATEGORIES: {
  id: RankingCategory;
  label: string;
  methodology: string;
}[] = [
  {
    id: 'growth',
    label: 'Melhores para Crescimento',
    methodology: 'Combina CAGR de Receita 5a (35%), CAGR de Lucro 5a (35%), ROIC/ROE (20%) e Saúde Financeira (10%).',
  },
  {
    id: 'dividends',
    label: 'Melhores para Dividendos',
    methodology: 'Pondera Dividend Yield (40%), sustentabilidade do Payout <= 85% (25%), Dívida/Qualidade (20%) e INVEST SCORE (15%).',
  },
  {
    id: 'valuation',
    label: 'Melhores por Valuation',
    methodology: 'Avalia desconto composto de P/L, EV/EBITDA (ou P/VP para bancos), PEG e qualidade mínima (ROE >= 10%).',
  },
  {
    id: 'roe',
    label: 'Melhores Empresas por ROE',
    methodology: 'Ordena por ROE ajustado por saúde financeira para evitar distorções de alavancagem excessiva.',
  },
  {
    id: 'roic',
    label: 'Melhores Empresas por ROIC',
    methodology: 'Avalia criação de valor econômico (ROIC) combinada com margem operacional e estabilidade de caixa.',
  },
  {
    id: 'earnings_growth',
    label: 'Maior Crescimento de Lucro',
    methodology: 'CAGR de Lucro 5a ponderado pela conversão de caixa e consistência de margem líquida.',
  },
  {
    id: 'revenue_growth',
    label: 'Maior Crescimento de Receita',
    methodology: 'CAGR de Receita 5a ajustado por margem bruta para validar crescimento com poder de precificação.',
  },
  {
    id: 'cash_generation',
    label: 'Maior Geração de Caixa',
    methodology: 'FCF Yield (Fluxo de Caixa Livre / Valor de Mercado) combinado com baixa alavancagem e FCF absoluto.',
  },
  {
    id: 'small_caps',
    label: 'Small Caps & Mid Caps Promissoras',
    methodology: 'Seleciona empresas de menor capitalização relativa com crescimento > 12%, margem sólida e saúde financeira.',
  },
  {
    id: 'financial_health',
    label: 'Melhor Saúde Financeira',
    methodology: 'Caixa líquido ou baixa Dív. Líq./EBITDA (<1,5x), Liquidez Corrente >= 1,2x e estabilidade de balanço.',
  },
  {
    id: 'upside_potential',
    label: 'Maior Potencial Estimado (DCF)',
    methodology: 'Potencial de valorização via Fluxo de Caixa Descontado (DCF) determinístico moderado pelo INVEST SCORE.',
  },
];

function computeDCFQuickUpside(eq: EquityOverview): { fairPrice: number; upsidePct: number } {
  const isBank = eq.sector === 'Bancos & Financeiro' && eq.ticker !== 'B3SA3';
  if (isBank) {
    // Gordon / ROE-justified P/VP model for banks
    const roe = eq.metricsSummary.roe ?? 16;
    const ke = eq.market === 'B3' ? 14.5 : 10.0;
    const g = eq.market === 'B3' ? 5.5 : 4.0;
    const justifiedPb = Math.max(0.8, (roe - g) / Math.max(2, ke - g));
    const currentPb = eq.metricsSummary.pb ?? 1.2;
    const fairPrice = Number((eq.price * (justifiedPb / currentPb)).toFixed(2));
    const upsidePct = Number((((fairPrice - eq.price) / eq.price) * 100).toFixed(1));
    return { fairPrice, upsidePct };
  }

  const baseRev =
    eq.metricsSummary.psr && eq.metricsSummary.psr > 0
      ? eq.marketCapMillions / eq.metricsSummary.psr
      : eq.marketCapMillions * 0.4;
  const opMargin = Math.max(8, (eq.metricsSummary.ebitdaMargin ?? 25) * 0.72);
  const wacc = eq.market === 'B3' ? 13.0 : 9.2;
  const g = Math.min(18, Math.max(4, (eq.metricsSummary.revenueCagr5y ?? 8) * 0.75));
  const netDebt =
    eq.metricsSummary.netDebtEbitda && eq.metricsSummary.evEbitda
      ? (eq.marketCapMillions / Math.max(1, eq.metricsSummary.evEbitda)) * eq.metricsSummary.netDebtEbitda
      : 0;

  const dcf = calculateDCF({
    currentPrice: eq.price,
    sharesOutstandingMillions: eq.sharesOutstandingMillions || 1000,
    baseRevenueMillions: baseRev,
    operatingMarginPct: opMargin,
    taxRatePct: eq.market === 'B3' ? 28 : 21,
    fcfConversionPct: 78,
    revenueGrowthPct: g,
    waccPct: wacc,
    perpetuityGrowthPct: eq.market === 'B3' ? 4.5 : 3.0,
    netDebtMillions: netDebt,
    projectionYears: 5,
  });

  return { fairPrice: dcf.fairValuePerShare, upsidePct: dcf.upsidePct };
}

export function generateRankings(
  equities: EquityOverview[],
  market: 'B3' | 'US',
  category: RankingCategory
): RankingEntry[] {
  const pool = equities.filter((e) => e.market === market);
  const catMeta = RANKING_CATEGORIES.find((c) => c.id === category)!;

  const scored = pool.map((eq) => {
    const m = eq.metricsSummary;
    const qualityGuard = eq.investScore.totalScore * 0.25;
    let rawScore = 50;
    let primaryLabel = 'INVEST SCORE';
    let primaryVal = `${eq.investScore.totalScore}/100`;
    let secondary: { label: string; value: string }[] = [];

    switch (category) {
      case 'growth': {
        const rg = m.revenueCagr5y ?? 0;
        const eg = m.earningsCagr5y ?? 0;
        rawScore = rg * 1.3 + eg * 1.1 + qualityGuard;
        primaryLabel = 'CAGR Lucro 5a';
        primaryVal = `${eg.toFixed(1)}%`;
        secondary = [
          { label: 'CAGR Rec. 5a', value: `${rg.toFixed(1)}%` },
          { label: 'ROE', value: `${(m.roe ?? 0).toFixed(1)}%` },
          { label: 'Score', value: `${eq.investScore.totalScore}` },
        ];
        break;
      }
      case 'dividends': {
        const dy = m.dividendYield ?? 0;
        const payout = m.payout ?? 50;
        const payoutPenalty = payout > 90 ? -15 : payout > 0 && payout <= 75 ? 12 : 4;
        rawScore = dy * 6.5 + payoutPenalty + qualityGuard;
        primaryLabel = 'Dividend Yield';
        primaryVal = `${dy.toFixed(2)}%`;
        secondary = [
          { label: 'Payout', value: `${payout.toFixed(0)}%` },
          { label: 'P/L', value: m.pe ? `${m.pe.toFixed(1)}x` : 'N/A' },
          { label: 'Score', value: `${eq.investScore.totalScore}` },
        ];
        break;
      }
      case 'valuation': {
        const fairPe = market === 'B3' ? 11 : 24;
        const peDiscount = m.pe && m.pe > 0 ? ((fairPe - m.pe) / fairPe) * 45 : -20;
        const roeFloor = (m.roe ?? 0) >= 12 ? 15 : -10;
        rawScore = 50 + peDiscount + roeFloor + qualityGuard;
        primaryLabel = 'P/L Atual';
        primaryVal = m.pe ? `${m.pe.toFixed(1)}x` : 'N/A';
        secondary = [
          { label: 'P/VP', value: m.pb ? `${m.pb.toFixed(2)}x` : 'N/A' },
          { label: 'EV/EBITDA', value: m.evEbitda ? `${m.evEbitda.toFixed(1)}x` : 'N/A' },
          { label: 'ROE', value: `${(m.roe ?? 0).toFixed(1)}%` },
        ];
        break;
      }
      case 'roe': {
        const roe = m.roe ?? 0;
        const ndPenalty = (m.netDebtEbitda ?? 0) > 2.5 ? -18 : 0;
        rawScore = Math.min(95, roe * 1.1) + ndPenalty + qualityGuard;
        primaryLabel = 'ROE';
        primaryVal = `${roe.toFixed(1)}%`;
        secondary = [
          { label: 'Marg. Líq.', value: `${(m.netMargin ?? 0).toFixed(1)}%` },
          { label: 'P/VP', value: m.pb ? `${m.pb.toFixed(2)}x` : 'N/A' },
        ];
        break;
      }
      case 'roic': {
        const roic = m.roic ?? (m.roe ?? 0) * 0.65;
        rawScore = (m.roic === null ? 15 : roic * 1.45) + qualityGuard;
        primaryLabel = 'ROIC';
        primaryVal = m.roic !== null ? `${m.roic.toFixed(1)}%` : 'N/A (Banco)';
        secondary = [
          { label: 'ROE', value: `${(m.roe ?? 0).toFixed(1)}%` },
          { label: 'Score', value: `${eq.investScore.totalScore}` },
        ];
        break;
      }
      case 'earnings_growth': {
        const eg = m.earningsCagr5y ?? 0;
        rawScore = eg * 1.8 + qualityGuard;
        primaryLabel = 'CAGR Lucro 5a';
        primaryVal = `${eg.toFixed(1)}%`;
        secondary = [
          { label: 'Marg. Líq.', value: `${(m.netMargin ?? 0).toFixed(1)}%` },
          { label: 'PEG', value: m.peg ? `${m.peg.toFixed(2)}x` : 'N/A' },
        ];
        break;
      }
      case 'revenue_growth': {
        const rg = m.revenueCagr5y ?? 0;
        rawScore = rg * 1.9 + (m.grossMargin ?? 0) * 0.25 + qualityGuard;
        primaryLabel = 'CAGR Receita 5a';
        primaryVal = `${rg.toFixed(1)}%`;
        secondary = [
          { label: 'Marg. Bruta', value: `${(m.grossMargin ?? 0).toFixed(1)}%` },
          { label: 'P/SR', value: m.psr ? `${m.psr.toFixed(2)}x` : 'N/A' },
        ];
        break;
      }
      case 'cash_generation': {
        const fcfYield =
          m.fcfMillions && eq.marketCapMillions > 0
            ? (m.fcfMillions / eq.marketCapMillions) * 100
            : 0;
        rawScore = fcfYield * 6.0 + qualityGuard;
        primaryLabel = 'FCF Yield';
        primaryVal = `${fcfYield.toFixed(2)}%`;
        secondary = [
          {
            label: 'FCF',
            value: `${eq.currency === 'BRL' ? 'R$' : 'US$'} ${(m.fcfMillions ?? 0).toLocaleString('pt-BR')}M`,
          },
          { label: 'P/FCF', value: m.pfcf ? `${m.pfcf.toFixed(1)}x` : 'N/A' },
        ];
        break;
      }
      case 'small_caps': {
        const capThreshold = market === 'B3' ? 75000 : 120000;
        const sizeBonus = eq.marketCapMillions < capThreshold ? 25 : -10;
        rawScore = sizeBonus + (m.revenueCagr5y ?? 0) * 1.2 + qualityGuard;
        primaryLabel = 'Valor de Mercado';
        primaryVal = `${eq.currency === 'BRL' ? 'R$' : 'US$'} ${(eq.marketCapMillions / 1000).toFixed(1)}B`;
        secondary = [
          { label: 'CAGR Rec.', value: `${(m.revenueCagr5y ?? 0).toFixed(1)}%` },
          { label: 'Score', value: `${eq.investScore.totalScore}` },
        ];
        break;
      }
      case 'financial_health': {
        const nd = m.netDebtEbitda ?? 0.5;
        const liq = m.currentRatio ?? 1.5;
        rawScore = 60 + (1.5 - nd) * 14 + (liq - 1) * 10 + qualityGuard;
        primaryLabel = 'Dív. Líq./EBITDA';
        primaryVal = m.netDebtEbitda !== null ? `${m.netDebtEbitda.toFixed(2)}x` : 'Banco (Reg.)';
        secondary = [
          { label: 'Liq. Corrente', value: m.currentRatio ? `${m.currentRatio.toFixed(2)}x` : 'N/A' },
          { label: 'ROE', value: `${(m.roe ?? 0).toFixed(1)}%` },
        ];
        break;
      }
      case 'upside_potential': {
        const dcf = computeDCFQuickUpside(eq);
        rawScore = Math.min(80, Math.max(-20, dcf.upsidePct)) + eq.investScore.totalScore * 0.65;
        primaryLabel = 'Potencial DCF Est.';
        primaryVal = `${dcf.upsidePct >= 0 ? '+' : ''}${dcf.upsidePct.toFixed(1)}%`;
        secondary = [
          {
            label: 'Justo Est.',
            value: `${eq.currency === 'BRL' ? 'R$' : 'US$'} ${dcf.fairPrice.toFixed(2)}`,
          },
          { label: 'Score', value: `${eq.investScore.totalScore}` },
        ];
        break;
      }
    }

    return {
      eq,
      score: Math.max(10, Math.min(99, Math.round(rawScore))),
      primaryLabel,
      primaryVal,
      secondary,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, idx) => ({
    rank: idx + 1,
    ticker: item.eq.ticker,
    name: item.eq.name,
    market: item.eq.market,
    sector: item.eq.sector,
    price: item.eq.price,
    currency: item.eq.currency,
    score: item.score,
    investScore: item.eq.investScore.totalScore,
    primaryMetricLabel: item.primaryLabel,
    primaryMetricValue: item.primaryVal,
    secondaryMetrics: item.secondary,
    criteriaNote: catMeta.methodology,
    referenceDate: item.eq.referenceStatementDate,
  }));
}
