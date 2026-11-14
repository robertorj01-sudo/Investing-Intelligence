import React, { useMemo, useState } from 'react';
import { Coins } from 'lucide-react';
import { simulatePassiveIncome } from '../shared/financialEngine';
import type { EquityOverview } from '../shared/types';
import { formatCurrency } from '../utils/formatters';

export function DividendsView({
  equities,
  onSelectTicker,
}: {
  equities: EquityOverview[];
  onSelectTicker: (ticker: string) => void;
}) {
  const [marketTab, setMarketTab] = useState<'B3' | 'US'>('B3');

  // Simulator state
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [years, setYears] = useState(15);
  const [annualYieldPct, setAnnualYieldPct] = useState(7.5);
  const [annualAppreciationPct, setAnnualAppreciationPct] = useState(5.0);
  const [annualDivGrowthPct, setAnnualDivGrowthPct] = useState(4.0);
  const [reinvestDividends, setReinvestDividends] = useState(true);
  const [taxProfile, setTaxProfile] = useState<
    'BR_DIVIDEND_ISENTO' | 'BR_JCP_15' | 'US_DIVIDEND_30'
  >('BR_DIVIDEND_ISENTO');

  const topPayers = useMemo(() => {
    return equities
      .filter((e) => e.market === marketTab && (e.metricsSummary.dividendYield ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.metricsSummary.dividendYield ?? 0) - (a.metricsSummary.dividendYield ?? 0)
      );
  }, [equities, marketTab]);

  const sim = useMemo(
    () =>
      simulatePassiveIncome({
        initialInvestment,
        monthlyContribution,
        years,
        annualDividendYieldPct: annualYieldPct,
        annualPriceAppreciationPct: annualAppreciationPct,
        annualDividendGrowthPct: annualDivGrowthPct,
        reinvestDividends,
        taxProfile,
      }),
    [
      initialInvestment,
      monthlyContribution,
      years,
      annualYieldPct,
      annualAppreciationPct,
      annualDivGrowthPct,
      reinvestDividends,
      taxProfile,
    ]
  );

  const simCurrency = taxProfile === 'US_DIVIDEND_30' ? 'USD' : 'BRL';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            Dividendos & Calculadora de Renda Passiva
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ranking de pagadoras consistentes no Brasil (Dividendos/JCP) e EUA (Cash Dividends) + simulação líquida de impostos.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button
            type="button"
            onClick={() => setMarketTab('B3')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              marketTab === 'B3'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Brasil (Dividendos & JCP)
          </button>
          <button
            type="button"
            onClick={() => setMarketTab('US')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              marketTab === 'US'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Estados Unidos (Cash Dividends)
          </button>
        </div>
      </div>

      {/* Top Dividend Payers Table */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Ranking de Proventos & Sustentabilidade ({marketTab})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {marketTab === 'B3'
              ? 'Dividendos: isentos de IR · JCP: 15% IR retido na fonte'
              : 'EUA: retenção de 30% na fonte (acordo tributário aplicável)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left py-2.5 px-4">Ticker / Empresa</th>
                <th className="text-right py-2.5 px-3">Cotação</th>
                <th className="text-right py-2.5 px-3">Dividend Yield (12M)</th>
                <th className="text-right py-2.5 px-3">Payout Ratio</th>
                <th className="text-right py-2.5 px-3">ROE</th>
                <th className="text-left py-2.5 px-4">Frequência</th>
                <th className="text-right py-2.5 px-4">INVEST SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {topPayers.map((eq) => (
                <tr key={eq.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectTicker(eq.ticker)}
                      className="text-left group"
                    >
                      <span className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                        {eq.ticker}
                      </span>
                      <span className="ml-2 text-slate-500 dark:text-slate-400">{eq.name}</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {formatCurrency(eq.price, eq.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {(eq.metricsSummary.dividendYield ?? 0).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {(eq.metricsSummary.payout ?? 0).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {(eq.metricsSummary.roe ?? 0).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                    {eq.dividendFrequency}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums">
                    {eq.investScore.totalScore}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passive Income Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Simulador de Renda Passiva Futura
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Investimento Inicial</span>
              <input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Aporte Mensal</span>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Prazo (Anos)</span>
              <input
                type="number"
                min={1}
                max={35}
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(35, Number(e.target.value))))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Dividend Yield Inicial (%)</span>
              <input
                type="number"
                step="0.25"
                value={annualYieldPct}
                onChange={(e) => setAnnualYieldPct(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Valorização Cota (% a.a.)</span>
              <input
                type="number"
                step="0.5"
                value={annualAppreciationPct}
                onChange={(e) => setAnnualAppreciationPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400">Cresc. Proventos (% a.a.)</span>
              <input
                type="number"
                step="0.5"
                value={annualDivGrowthPct}
                onChange={(e) => setAnnualDivGrowthPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Regra Tributária Aplicável</span>
            <select
              value={taxProfile}
              onChange={(e) => setTaxProfile(e.target.value as typeof taxProfile)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
            >
              <option value="BR_DIVIDEND_ISENTO">Brasil — Dividendos (0% IR na fonte)</option>
              <option value="BR_JCP_15">Brasil — JCP (15% IR retido na fonte)</option>
              <option value="US_DIVIDEND_30">EUA — Cash Dividends (30% IR retido na fonte)</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reinvestDividends}
              onChange={(e) => setReinvestDividends(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600"
            />
            <span>Reinvestir dividendos líquidos mensalmente (Juros Compostos)</span>
          </label>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Patrimônio Final ({years}a)</div>
              <div className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatCurrency(sim.finalPatrimony, simCurrency)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Aportado</div>
              <div className="font-mono text-lg font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
                {formatCurrency(sim.totalContributed, simCurrency)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Proventos Líquidos Acum.</div>
              <div className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {formatCurrency(sim.totalNetDividends, simCurrency)}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Bruto: {formatCurrency(sim.totalGrossDividends, simCurrency)} · IR: {sim.taxRatePct}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Renda Mensal Líquida (Ano {years})</div>
              <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {formatCurrency(sim.finalMonthlyNetIncome, simCurrency)}/mês
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-left">Ano</th>
                  <th className="py-2 px-3 text-right">Patrimônio</th>
                  <th className="py-2 px-3 text-right">Aportado</th>
                  <th className="py-2 px-3 text-right">Dividendo Bruto/Ano</th>
                  <th className="py-2 px-3 text-right">Dividendo Líq./Ano</th>
                  <th className="py-2 px-3 text-right">Renda Mensal Líq.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {sim.timeline.map((row) => (
                  <tr key={row.year}>
                    <td className="py-2 px-3">Ano {row.year}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatCurrency(row.patrimony, simCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                      {formatCurrency(row.contributed, simCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatCurrency(row.annualGrossDividend, simCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.annualNetDividend, simCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.monthlyNetIncome, simCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
