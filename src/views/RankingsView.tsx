import React, { useEffect, useState } from 'react';
import { Award, Info } from 'lucide-react';
import type { RankingCategory, RankingEntry } from '../server/rankings';
import { formatCurrency } from '../utils/formatters';

interface RankingsApiResponse {
  market: 'B3' | 'US';
  category: RankingCategory;
  categories: { id: RankingCategory; label: string; methodology: string }[];
  items: RankingEntry[];
  updatedAt: string;
}

export function RankingsView({
  onSelectTicker,
}: {
  onSelectTicker: (ticker: string) => void;
}) {
  const [market, setMarket] = useState<'B3' | 'US'>('B3');
  const [category, setCategory] = useState<RankingCategory>('growth');
  const [data, setData] = useState<RankingsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/rankings?market=${market}&category=${category}`)
      .then((r) => r.json())
      .then((d: RankingsApiResponse) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market, category]);

  const activeCategoryMeta = data?.categories.find((c) => c.id === category);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Rankings Quantitativos & INVEST SCORE
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Rankings separados por mercado (Brasil B3 e EUA NYSE/NASDAQ) com metodologia composta que evita distorções por indicadores isolados.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button
            type="button"
            onClick={() => setMarket('B3')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              market === 'B3'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Brasil (B3)
          </button>
          <button
            type="button"
            onClick={() => setMarket('US')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              market === 'US'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Estados Unidos (NYSE/NASDAQ)
          </button>
        </div>
      </div>

      {/* Category Selector */}
      <div className="flex flex-wrap gap-2">
        {(data?.categories || []).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              category === c.id
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-[#0F1623] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {activeCategoryMeta && (
        <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white">
              Critério Transparente ({activeCategoryMeta.label}):
            </strong>{' '}
            {activeCategoryMeta.methodology} · Data de referência dos demonstrativos:{' '}
            {data?.items[0]?.referenceDate || '3T26 / 2025'}.
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Calculando ranking...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Ticker / Empresa</th>
                  <th className="text-left py-3 px-4">Setor</th>
                  <th className="text-right py-3 px-4">Cotação</th>
                  <th className="text-right py-3 px-4">
                    {data?.items[0]?.primaryMetricLabel || 'Indicador Principal'}
                  </th>
                  <th className="text-left py-3 px-4">Indicadores Complementares</th>
                  <th className="text-right py-3 px-4">INVEST SCORE</th>
                  <th className="text-right py-3 px-4">Pontuação Ranking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(data?.items || []).map((item) => (
                  <tr
                    key={item.ticker}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {item.rank}º
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectTicker(item.ticker)}
                        className="text-left group"
                      >
                        <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                          {item.ticker}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.name}
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.sector}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.price, item.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.primaryMetricValue}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {item.secondaryMetrics.map((m) => `${m.label}: ${m.value}`).join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {item.investScore}/100
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {item.score}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
