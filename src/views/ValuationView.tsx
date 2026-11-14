import React, { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import {
  calculateDCF,
  calculateDCFSensitivityMatrix,
  calculateGordonGrowth,
} from '../shared/financialEngine';
import type { EquityFullDetail, EquityOverview } from '../shared/types';
import { formatCurrency } from '../utils/formatters';

export function ValuationView({
  equities,
  initialTicker,
}: {
  equities: EquityOverview[];
  initialTicker?: string;
}) {
  const [selectedTicker, setSelectedTicker] = useState(initialTicker || 'WEGE3');
  const [detail, setDetail] = useState<EquityFullDetail | null>(null);

  // DCF Sliders
  const [revenueGrowthPct, setRevenueGrowthPct] = useState(14);
  const [operatingMarginPct, setOperatingMarginPct] = useState(20);
  const [waccPct, setWaccPct] = useState(12.5);
  const [perpetuityGrowthPct, setPerpetuityGrowthPct] = useState(4.5);
  const [fcfConversionPct, setFcfConversionPct] = useState(80);
  const [projectionYears, setProjectionYears] = useState(5);

  // Gordon & Multiple
  const [gordonGrowthPct, setGordonGrowthPct] = useState(6.0);
  const [requiredReturnPct, setRequiredReturnPct] = useState(13.0);
  const [targetPe, setTargetPe] = useState(14);

  useEffect(() => {
    if (initialTicker) setSelectedTicker(initialTicker);
  }, [initialTicker]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/equities/${encodeURIComponent(selectedTicker)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: EquityFullDetail | null) => {
        if (!cancelled && d) {
          setDetail(d);
          const latest = d.statementsAnnual[d.statementsAnnual.length - 1];
          const opM =
            latest && latest.revenue > 0 ? (latest.ebit / latest.revenue) * 100 : 20;
          setOperatingMarginPct(Number(Math.max(5, Math.min(65, opM)).toFixed(1)));
          setRevenueGrowthPct(
            Number(Math.max(3, Math.min(28, d.metricsSummary.revenueCagr5y ?? 10)).toFixed(1))
          );
          setWaccPct(d.market === 'B3' ? 12.8 : 9.2);
          setPerpetuityGrowthPct(d.market === 'B3' ? 4.5 : 3.0);
          setRequiredReturnPct(d.market === 'B3' ? 13.5 : 9.5);
          setTargetPe(
            Math.round(
              d.fundamentals.find((f) => f.key === 'pe')?.sectorAverage ??
                (d.market === 'B3' ? 11 : 24)
            )
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  const dcfInput = useMemo(() => {
    const latest = detail?.statementsAnnual[detail.statementsAnnual.length - 1];
    return {
      currentPrice: detail?.price ?? 50,
      sharesOutstandingMillions: detail?.sharesOutstandingMillions || 1000,
      baseRevenueMillions: latest?.revenue ?? 10000,
      operatingMarginPct,
      taxRatePct: detail?.market === 'B3' ? 28 : 21,
      fcfConversionPct,
      revenueGrowthPct,
      waccPct,
      perpetuityGrowthPct,
      netDebtMillions: latest?.netDebt ?? 0,
      projectionYears,
    };
  }, [
    detail,
    operatingMarginPct,
    fcfConversionPct,
    revenueGrowthPct,
    waccPct,
    perpetuityGrowthPct,
    projectionYears,
  ]);

  const dcfResult = useMemo(() => calculateDCF(dcfInput), [dcfInput]);
  const sensitivity = useMemo(() => calculateDCFSensitivityMatrix(dcfInput), [dcfInput]);

  const gordonResult = useMemo(() => {
    const dy = detail?.metricsSummary.dividendYield ?? 4;
    const annualDiv = ((detail?.price ?? 50) * dy) / 100;
    return calculateGordonGrowth({
      annualDividendPerShare: annualDiv,
      dividendGrowthPct: gordonGrowthPct,
      requiredReturnPct,
      currentPrice: detail?.price ?? 50,
    });
  }, [detail, gordonGrowthPct, requiredReturnPct]);

  const multipleFairPrice = useMemo(() => {
    const eps = detail?.metricsSummary.eps ?? 0;
    return Number(Math.max(0, eps * targetPe).toFixed(2));
  }, [detail, targetPe]);

  const currency = detail?.currency ?? 'BRL';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-500" />
            Calculadora de Preço Justo & Valuation (DCF · Gordon · Múltiplos)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Simulação determinística do valor intrínseco com análise de sensibilidade e cenários.
          </p>
        </div>

        <select
          value={selectedTicker}
          onChange={(e) => setSelectedTicker(e.target.value)}
          aria-label="Selecionar empresa para valuation"
          className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] text-slate-900 dark:text-white"
        >
          {equities.map((eq) => (
            <option key={eq.ticker} value={eq.ticker}>
              {eq.ticker} — {eq.name}
            </option>
          ))}
        </select>
      </div>

      {/* Top Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Cotação Atual ({selectedTicker})</div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(dcfResult.currentPrice, currency)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            P/L atual: {detail?.metricsSummary.pe?.toFixed(1) ?? 'N/A'}x
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Preço Justo DCF (Cenário Base)</div>
          <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(dcfResult.fairValuePerShare, currency)}
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
            Margem de Segurança: {dcfResult.marginOfSafetyPct.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Potencial de Valorização (DCF)</div>
          <div
            className={`font-mono text-2xl font-bold tabular-nums ${
              dcfResult.upsidePct >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {dcfResult.upsidePct >= 0 ? '+' : ''}
            {dcfResult.upsidePct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Pess.: {formatCurrency(dcfResult.scenarios.pessimistic, currency)} · Otim.:{' '}
            {formatCurrency(dcfResult.scenarios.optimistic, currency)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Gordon & Múltiplo Alvo</div>
          <div className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(multipleFairPrice, currency)} <span className="text-xs font-normal text-slate-400">(P/L {targetPe}x)</span>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Gordon (DDM): {formatCurrency(gordonResult.fairValue, currency)}
          </div>
        </div>
      </div>

      {/* Interactive Premise Sliders + Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Premissas do Fluxo de Caixa Descontado (DCF)
          </h2>

          {[
            { label: 'Crescimento Esperado Receita (% a.a.)', val: revenueGrowthPct, set: setRevenueGrowthPct, min: 0, max: 35, step: 0.5 },
            { label: 'Margem Operacional EBIT (%)', val: operatingMarginPct, set: setOperatingMarginPct, min: 4, max: 65, step: 0.5 },
            { label: 'WACC / Taxa de Desconto (% a.a.)', val: waccPct, set: setWaccPct, min: 6, max: 20, step: 0.25 },
            { label: 'Crescimento na Perpetuidade g (%)', val: perpetuityGrowthPct, set: setPerpetuityGrowthPct, min: 1, max: 7, step: 0.25 },
            { label: 'Conversão NOPAT em FCF (%)', val: fcfConversionPct, set: setFcfConversionPct, min: 40, max: 110, step: 2 },
            { label: 'Horizonte Explícito (Anos)', val: projectionYears, set: setProjectionYears, min: 5, max: 10, step: 1 },
          ].map((ctrl) => (
            <div key={ctrl.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">{ctrl.label}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {ctrl.val}
                </span>
              </div>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={ctrl.val}
                onChange={(e) => ctrl.set(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Premissas Gordon & Múltiplo Setorial
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] space-y-1">
                <span className="text-slate-500">Cresc. Div. %</span>
                <input
                  type="number"
                  step="0.5"
                  value={gordonGrowthPct}
                  onChange={(e) => setGordonGrowthPct(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </label>
              <label className="text-[11px] space-y-1">
                <span className="text-slate-500">Taxa Ke %</span>
                <input
                  type="number"
                  step="0.5"
                  value={requiredReturnPct}
                  onChange={(e) => setRequiredReturnPct(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </label>
              <label className="text-[11px] space-y-1">
                <span className="text-slate-500">P/L Alvo</span>
                <input
                  type="number"
                  step="1"
                  value={targetPe}
                  onChange={(e) => setTargetPe(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Sensitivity Matrix & FCF Projection Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Matriz de Sensibilidade — WACC vs. Crescimento na Perpetuidade (g)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verde indica preço justo acima da cotação atual ({formatCurrency(dcfResult.currentPrice, currency)}).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 px-3 text-left">WACC \ g</th>
                    {sensitivity.perpSteps.map((g) => (
                      <th key={g} className="py-2 px-3 text-right">
                        {g.toFixed(2)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {sensitivity.matrix.map((row) => (
                    <tr key={row.wacc}>
                      <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {row.wacc.toFixed(2)}%
                      </td>
                      {row.cells.map((c) => {
                        const positive = c.upsidePct >= 10;
                        const neutral = c.upsidePct >= -5 && c.upsidePct < 10;
                        return (
                          <td
                            key={c.perp}
                            className={`py-2 px-3 text-right tabular-nums ${
                              positive
                                ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-semibold'
                                : neutral
                                ? 'bg-slate-500/8 text-slate-700 dark:text-slate-200'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {formatCurrency(c.fairValue, currency)}
                            <div className="text-[10px] opacity-80">
                              {c.upsidePct >= 0 ? '+' : ''}
                              {c.upsidePct.toFixed(1)}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Projeção de Fluxo de Caixa Livre (em milhões de {currency})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Ano</th>
                    <th className="py-2 px-3 text-right">Receita Est.</th>
                    <th className="py-2 px-3 text-right">EBIT Est.</th>
                    <th className="py-2 px-3 text-right">FCF Projetado</th>
                    <th className="py-2 px-3 text-right">Valor Presente (VP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {dcfResult.yearlyProjections.map((yr) => (
                    <tr key={yr.year}>
                      <td className="py-2 px-3">Ano {yr.year}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {yr.revenue.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {yr.ebit.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {yr.fcf.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {yr.discountedFcf.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
