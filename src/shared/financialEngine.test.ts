import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
  calculateFibonacciRetracement,
  detectSupportResistance,
  calculateInvestScore,
  calculateDCF,
  calculateDCFSensitivityMatrix,
  calculateGordonGrowth,
  simulatePassiveIncome,
  calculatePortfolioAnalytics,
} from './financialEngine.ts';
import type { EquityOverview, PriceBar } from './types.ts';

describe('Financial Engine - Technical Indicators', () => {
  it('computes SMA accurately with null padding', () => {
    const sma = calculateSMA([10, 20, 30, 40, 50], 3);
    assert.deepEqual(sma, [null, null, 20, 30, 40]);
  });

  it('computes EMA accurately', () => {
    const ema = calculateEMA([10, 20, 30, 40, 50], 3);
    assert.equal(ema[0], null);
    assert.equal(ema[1], null);
    assert.equal(ema[2], 20);
    assert.equal(ema[3], 30);
    assert.equal(ema[4], 40);
  });

  it('computes RSI bounded between 0 and 100 and detects uptrend', () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    const rsi = calculateRSI(rising, 14);
    assert.equal(rsi[13], null);
    assert.equal(rsi[14], 100);
    assert.equal(rsi[29], 100);

    const mixed = [
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89,
      46.03, 45.61, 46.28, 46.28, 46.0, 46.03, 46.41, 46.22, 45.64,
    ];
    const rsiMixed = calculateRSI(mixed, 14);
    const lastRsi = rsiMixed[rsiMixed.length - 1];
    assert.ok(lastRsi !== null && lastRsi > 40 && lastRsi < 80);
  });

  it('computes MACD, Signal, and Histogram when series length >= 35', () => {
    const closes = Array.from({ length: 45 }, (_, i) => 50 + Math.sin(i / 4) * 5 + i * 0.4);
    const { macd, signal, histogram } = calculateMACD(closes);
    assert.equal(macd.length, 45);
    assert.ok(macd[25] !== null);
    assert.ok(signal[33] !== null);
    assert.ok(histogram[33] !== null);
  });

  it('computes Bollinger Bands where upper > middle > lower', () => {
    const closes = Array.from({ length: 25 }, (_, i) => 100 + (i % 2 === 0 ? 2 : -2));
    const bb = calculateBollingerBands(closes, 20, 2);
    assert.equal(bb.middle[18], null);
    const u = bb.upper[24]!;
    const m = bb.middle[24]!;
    const l = bb.lower[24]!;
    assert.ok(u > m && m > l);
  });

  it('computes VWAP, Fibonacci levels, and Support/Resistance', () => {
    const bars: PriceBar[] = Array.from({ length: 30 }, (_, i) => ({
      time: `2026-01-${String(i + 1).padStart(2, '0')}`,
      open: 100 + i,
      high: 105 + i,
      low: 95 + i,
      close: 102 + i,
      volume: 1000000 + i * 10000,
    }));
    const vwap = calculateVWAP(bars);
    assert.equal(vwap.length, 30);
    assert.ok(vwap[29] > 100);

    const fib = calculateFibonacciRetracement(bars);
    assert.equal(fib.length, 7);
    assert.equal(fib[0].price, 134); // max high = 105 + 29 = 134
    assert.equal(fib[6].price, 95); // min low = 95

    const sr = detectSupportResistance(bars);
    assert.ok(sr.supports.length >= 1);
    assert.ok(sr.resistances.length >= 1);
  });
});

describe('Financial Engine - INVEST SCORE & Valuation', () => {
  it('applies bank-specific methodology without penalizing missing EV/EBITDA', () => {
    const score = calculateInvestScore({
      sector: 'Bancos & Financeiro',
      market: 'B3',
      beta: 0.92,
      pe: 8.5,
      pb: 1.45,
      evEbitda: null,
      roe: 21.5,
      roic: null,
      grossMargin: 52,
      netMargin: 24,
      netDebtEbitda: null,
      currentRatio: null,
      dividendYield: 7.4,
      revenueCagr5y: 11,
      earningsCagr5y: 13,
      fcfMillions: null,
      marketCapMillions: 310000,
      referenceDate: '2025-12-31',
    });
    assert.equal(score.pillars.length, 7);
    assert.ok(score.totalScore >= 70 && score.totalScore <= 98);
    assert.ok(score.methodologyNote.includes('bancária'));
  });

  it('computes DCF fair value, scenarios, and sensitivity matrix consistently', () => {
    const dcfInput = {
      currentPrice: 50,
      sharesOutstandingMillions: 1000,
      baseRevenueMillions: 20000,
      operatingMarginPct: 25,
      taxRatePct: 25,
      fcfConversionPct: 85,
      revenueGrowthPct: 12,
      waccPct: 10,
      perpetuityGrowthPct: 3,
      netDebtMillions: 5000,
      projectionYears: 5,
    };
    const res = calculateDCF(dcfInput);
    assert.ok(res.fairValuePerShare > 0);
    assert.ok(res.scenarios.optimistic > res.scenarios.base);
    assert.ok(res.scenarios.base > res.scenarios.pessimistic);
    assert.equal(res.yearlyProjections.length, 5);

    const matrix = calculateDCFSensitivityMatrix(dcfInput);
    assert.equal(matrix.waccSteps.length, 5);
    assert.equal(matrix.perpSteps.length, 5);
    assert.equal(matrix.matrix.length, 5);
    // Lower WACC yields higher fair value at same perpetuity growth
    assert.ok(matrix.matrix[0].cells[2].fairValue > matrix.matrix[4].cells[2].fairValue);
  });

  it('computes Gordon Growth model correctly', () => {
    const gordon = calculateGordonGrowth({
      annualDividendPerShare: 3.0,
      dividendGrowthPct: 5,
      requiredReturnPct: 11,
      currentPrice: 45,
    });
    // D1 = 3 * 1.05 = 3.15; Fair Value = 3.15 / (0.11 - 0.05) = 52.50
    assert.equal(gordon.d1, 3.15);
    assert.equal(gordon.fairValue, 52.5);
    assert.ok(gordon.upsidePct > 15);
  });
});

describe('Financial Engine - Passive Income & Portfolio Analytics', () => {
  it('calculates BR exempt dividends, BR JCP 15%, and US 30% withholding taxes', () => {
    const base = {
      initialInvestment: 100000,
      monthlyContribution: 0,
      years: 5,
      annualDividendYieldPct: 6,
      annualPriceAppreciationPct: 0,
      annualDividendGrowthPct: 0,
      reinvestDividends: false,
    };
    const brDiv = simulatePassiveIncome({ ...base, taxProfile: 'BR_DIVIDEND_ISENTO' });
    const brJcp = simulatePassiveIncome({ ...base, taxProfile: 'BR_JCP_15' });
    const usDiv = simulatePassiveIncome({ ...base, taxProfile: 'US_DIVIDEND_30' });

    assert.equal(brDiv.taxRatePct, 0);
    assert.equal(brDiv.totalTaxesPaid, 0);
    assert.equal(brJcp.taxRatePct, 15);
    assert.equal(usDiv.taxRatePct, 30);
    assert.ok(brDiv.totalNetDividends > brJcp.totalNetDividends);
    assert.ok(brJcp.totalNetDividends > usDiv.totalNetDividends);
  });

  it('aggregates multi-currency portfolio P&L, FX conversion, and concentration alert', () => {
    const eqMap = new Map<string, EquityOverview>([
      [
        'ITUB4',
        {
          ticker: 'ITUB4',
          yahooSymbol: 'ITUB4.SA',
          name: 'Itaú Unibanco',
          market: 'B3',
          exchange: 'B3',
          currency: 'BRL',
          sector: 'Bancos & Financeiro',
          segment: 'Bancos',
          tags: [],
          price: 35,
          previousClose: 34,
          change: 1,
          changePct: 2.94,
          marketCapMillions: 340000,
          volumeMillions: 800,
          avgDailyVolumeMillions: 750,
          high52w: 38,
          low52w: 28,
          sharesOutstandingMillions: 9800,
          freeFloatPct: 50,
          beta: 0.9,
          dividendFrequency: 'Mensal',
          nextEarningsDate: '2026-05-10',
          source: 'Test',
          feedStatus: 'reference_snapshot',
          updatedAt: '2026-04-01T12:00:00Z',
          referenceStatementDate: '2025-12-31',
          metricsSummary: {} as EquityOverview['metricsSummary'],
          investScore: {} as EquityOverview['investScore'],
        },
      ],
      [
        'NVDA',
        {
          ticker: 'NVDA',
          yahooSymbol: 'NVDA',
          name: 'NVIDIA',
          market: 'US',
          exchange: 'NASDAQ',
          currency: 'USD',
          sector: 'Semicondutores & IA',
          segment: 'Semicondutores',
          tags: [],
          price: 120,
          previousClose: 118,
          change: 2,
          changePct: 1.69,
          marketCapMillions: 2900000,
          volumeMillions: 40000,
          avgDailyVolumeMillions: 35000,
          high52w: 150,
          low52w: 80,
          sharesOutstandingMillions: 24500,
          freeFloatPct: 96,
          beta: 1.65,
          dividendFrequency: 'Trimestral',
          nextEarningsDate: '2026-05-25',
          source: 'Test',
          feedStatus: 'reference_snapshot',
          updatedAt: '2026-04-01T12:00:00Z',
          referenceStatementDate: '2025-12-31',
          metricsSummary: {} as EquityOverview['metricsSummary'],
          investScore: {} as EquityOverview['investScore'],
        },
      ],
    ]);

    const analytics = calculatePortfolioAnalytics(
      [
        {
          id: 1,
          ticker: 'ITUB4',
          market: 'B3',
          type: 'BUY',
          quantity: 100,
          price: 30,
          currency: 'BRL',
          fees: 0,
          executedAt: '2026-01-10',
        },
        {
          id: 2,
          ticker: 'ITUB4',
          market: 'B3',
          type: 'DIVIDEND',
          quantity: 100,
          price: 1,
          currency: 'BRL',
          fees: 0,
          executedAt: '2026-02-10',
        },
        {
          id: 3,
          ticker: 'NVDA',
          market: 'US',
          type: 'BUY',
          quantity: 20,
          price: 100,
          currency: 'USD',
          fees: 0,
          executedAt: '2026-01-15',
        },
      ],
      eqMap,
      5.0
    );

    // ITUB4: 100 * 35 = 3500 BRL; NVDA: 20 * 120 * 5 = 12000 BRL -> Total 15500 BRL
    assert.equal(analytics.summary.totalValueBrl, 15500);
    assert.equal(analytics.summary.totalCostBrl, 13000);
    assert.equal(analytics.summary.unrealizedPnlBrl, 2500);
    assert.equal(analytics.summary.dividendsBrl, 100);
    assert.ok(analytics.summary.concentrationAlert !== null);
    assert.equal(analytics.byCurrency.length, 2);
  });
});
