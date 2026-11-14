import React, { useEffect, useState } from 'react';
import { GitCompare, Plus, X } from 'lucide-react';
import type { EquityFullDetail, EquityOverview } from '../shared/types';
import { formatCompactCap, formatCurrency } from '../utils/formatters';

const PRESET_COMPARISONS = [
  { label: 'Bancos BR: ITUB4 x BBAS3 x BBDC4', tickers: ['ITUB4', 'BBAS3', 'BBDC4'] },
  { label: 'Semicondutores IA: NVDA x AMD x AVGO', tickers: ['NVDA', 'AMD', 'AVGO'] },
  { label: 'Big Techs EUA: AAPL x MSFT x GOOGL', tickers: ['AAPL', 'MSFT', 'GOOGL'] },
  { label: 'Óleo & Gás: PETR4 x PRIO3 x XOM', tickers: ['PETR4', 'PRIO3', 'XOM'] },
];

export function ComparatorView({
  equities,
  onSelectTicker,
}: {
  equities: EquityOverview[];
  onSelectTicker: (ticker: string) => void;
}) {
  const [tickers, setTickers] = useState<string[]>(['ITUB4', 'BBAS3', 'BBDC4']);
  const [details, setDetails] = useState<EquityFullDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [addChoice, setAddChoice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      tickers.map((t) =>
        fetch(`/api/equities/${encodeURIComponent(t)}`).then((r) => (r.ok ? r.json() : null))
      )
    )
      .then((res) => {
        if (!cancelled) {
          setDetails(res.filter((x): x is EquityFullDetail => x !== null));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tickers]);

  const handleAdd = (tk: string) => {
    if (!tk || tickers.includes(tk) || tickers.length >= 5) return;
    setTickers((prev) => [...prev, tk]);
    setAddChoice('');
  };

  const handleRemove = (tk: string) => {
    if (tickers.length <= 2) return;
    setTickers((prev) => prev.filter((t) => t !== tk));
  };

  const metricRows: {
    label: string;
    format: (e: EquityFullDetail) => string;
    bestMode?: 'min' | 'max';
    getVal?: (e: EquityFullDetail) => number | null;
  }[] = [
    { label: 'Bolsa / Setor', format: (e) => `${e.exchange} · ${e.sector}` },
    { label: 'Cotação Atual', format: (e) => formatCurrency(e.price, e.currency) },
    { label: 'Valor de Mercado', format: (e) => formatCompactCap(e.marketCapMillions, e.currency) },
    {
      label: 'INVEST SCORE',
      format: (e) => `${e.investScore.totalScore}/100`,
      bestMode: 'max',
      getVal: (e) => e.investScore.totalScore,
    },
    {
      label: 'P/L',
      format: (e) => (e.metricsSummary.pe !== null ? `${e.metricsSummary.pe.toFixed(1)}x` : 'N/A'),
      bestMode: 'min',
      getVal: (e) => e.metricsSummary.pe,
    },
    {
      label: 'P/VP',
      format: (e) => (e.metricsSummary.pb !== null ? `${e.metricsSummary.pb.toFixed(2)}x` : 'N/A'),
      bestMode: 'min',
      getVal: (e) => e.metricsSummary.pb,
    },
    {
      label: 'EV/EBITDA',
      format: (e) =>
        e.metricsSummary.evEbitda !== null ? `${e.metricsSummary.evEbitda.toFixed(1)}x` : 'N/A',
      bestMode: 'min',
      getVal: (e) => e.metricsSummary.evEbitda,
    },
    {
      label: 'PEG Ratio',
      format: (e) => (e.metricsSummary.peg !== null ? `${e.metricsSummary.peg.toFixed(2)}x` : 'N/A'),
      bestMode: 'min',
      getVal: (e) => e.metricsSummary.peg,
    },
    {
      label: 'ROE',
      format: (e) => (e.metricsSummary.roe !== null ? `${e.metricsSummary.roe.toFixed(1)}%` : 'N/A'),
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.roe,
    },
    {
      label: 'ROIC',
      format: (e) =>
        e.metricsSummary.roic !== null ? `${e.metricsSummary.roic.toFixed(1)}%` : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.roic,
    },
    {
      label: 'Margem Bruta',
      format: (e) =>
        e.metricsSummary.grossMargin !== null ? `${e.metricsSummary.grossMargin.toFixed(1)}%` : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.grossMargin,
    },
    {
      label: 'Margem Líquida',
      format: (e) =>
        e.metricsSummary.netMargin !== null ? `${e.metricsSummary.netMargin.toFixed(1)}%` : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.netMargin,
    },
    {
      label: 'Dív. Líq./EBITDA',
      format: (e) =>
        e.metricsSummary.netDebtEbitda !== null
          ? `${e.metricsSummary.netDebtEbitda.toFixed(2)}x`
          : 'N/A',
      bestMode: 'min',
      getVal: (e) => e.metricsSummary.netDebtEbitda,
    },
    {
      label: 'Dividend Yield',
      format: (e) =>
        e.metricsSummary.dividendYield !== null
          ? `${e.metricsSummary.dividendYield.toFixed(2)}%`
          : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.dividendYield,
    },
    {
      label: 'CAGR Receita (5a)',
      format: (e) =>
        e.metricsSummary.revenueCagr5y !== null
          ? `${e.metricsSummary.revenueCagr5y.toFixed(1)}%`
          : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.revenueCagr5y,
    },
    {
      label: 'CAGR Lucro (5a)',
      format: (e) =>
        e.metricsSummary.earningsCagr5y !== null
          ? `${e.metricsSummary.earningsCagr5y.toFixed(1)}%`
          : 'N/A',
      bestMode: 'max',
      getVal: (e) => e.metricsSummary.earningsCagr5y,
    },
    {
      label: 'RSI (14)',
      format: (e) => e.metricsSummary.rsi14.toFixed(1),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-500" />
            Comparador de Ações (até 5 empresas)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Compare múltiplos, rentabilidade, crescimento, dívida, dividendos e pontos fortes lado a lado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={addChoice}
            onChange={(e) => handleAdd(e.target.value)}
            disabled={tickers.length >= 5}
            aria-label="Adicionar empresa para comparar"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] text-slate-800 dark:text-slate-200"
          >
            <option value="">
              {tickers.length >= 5 ? 'Máximo de 5 empresas' : '+ Adicionar empresa...'}
            </option>
            {equities
              .filter((e) => !tickers.includes(e.ticker))
              .map((e) => (
                <option key={e.ticker} value={e.ticker}>
                  {e.ticker} — {e.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Presets & Active Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESET_COMPARISONS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setTickers(p.tickers)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] hover:border-emerald-500/50 text-slate-700 dark:text-slate-300"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {tickers.map((tk) => (
            <div
              key={tk}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-900 dark:bg-slate-800 text-white"
            >
              <span>{tk}</span>
              {tickers.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemove(tk)}
                  aria-label={`Remover ${tk}`}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Matrix */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Carregando comparação...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold">Indicador</th>
                  {details.map((d) => (
                    <th key={d.ticker} className="text-right py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectTicker(d.ticker)}
                        className="font-mono text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-500"
                      >
                        {d.ticker}
                      </button>
                      <div className="text-[11px] font-normal text-slate-500 truncate max-w-[140px] ml-auto">
                        {d.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {metricRows.map((row) => {
                  let bestTicker = '';
                  if (row.bestMode && row.getVal) {
                    const valid = details
                      .map((d) => ({ tk: d.ticker, val: row.getVal!(d) }))
                      .filter((x): x is { tk: string; val: number } => x.val !== null);
                    if (valid.length > 0) {
                      valid.sort((a, b) =>
                        row.bestMode === 'max' ? b.val - a.val : a.val - b.val
                      );
                      bestTicker = valid[0].tk;
                    }
                  }

                  return (
                    <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {row.label}
                      </td>
                      {details.map((d) => {
                        const isBest = bestTicker === d.ticker;
                        return (
                          <td
                            key={d.ticker}
                            className={`py-2.5 px-4 text-right font-mono tabular-nums ${
                              isBest
                                ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {row.format(d)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {details.map((d) => (
          <div
            key={d.ticker}
            className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {d.ticker}
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Score {d.investScore.totalScore}/100
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Pontos Fortes
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                {d.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Riscos / Atenção
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                {d.weaknesses.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
