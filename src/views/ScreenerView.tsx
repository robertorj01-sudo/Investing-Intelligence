import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Filter, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { EquityOverview } from '../shared/types';
import { formatCompactCap, formatCurrency, formatPct } from '../utils/formatters';

interface ScreenerFilters {
  market: 'ALL' | 'B3' | 'US';
  minPe: string;
  maxPe: string;
  maxPb: string;
  minRoe: string;
  minRoic: string;
  minNetMargin: string;
  minRevCagr: string;
  minEarnCagr: string;
  minDy: string;
  maxNetDebtEbitda: string;
  minMarketCapB: string;
  onlyPositiveFcf: boolean;
  aboveSma200: boolean;
  macdPositive: boolean;
  volumeAboveAvg: boolean;
  rsiFilter: 'ALL' | 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  specialTag: string;
}

const DEFAULT_FILTERS: ScreenerFilters = {
  market: 'ALL',
  minPe: '',
  maxPe: '',
  maxPb: '',
  minRoe: '',
  minRoic: '',
  minNetMargin: '',
  minRevCagr: '',
  minEarnCagr: '',
  minDy: '',
  maxNetDebtEbitda: '',
  minMarketCapB: '',
  onlyPositiveFcf: false,
  aboveSma200: false,
  macdPositive: false,
  volumeAboveAvg: false,
  rsiFilter: 'ALL',
  specialTag: '',
};

const SPECIAL_TAGS = [
  'Blue Chips',
  'Growth Stocks',
  'Value Stocks',
  'Dividend Stocks',
  'Small Caps',
  'Tecnologia',
  'Inteligência Artificial',
  'Semicondutores',
  'Bancos',
  'Energia',
  'Saúde',
  'Cibersegurança',
];

interface SavedScreenerRow {
  id: number;
  name: string;
  filters: ScreenerFilters;
}

export function ScreenerView({
  equities,
  onSelectTicker,
  onAddToWatchlist,
}: {
  equities: EquityOverview[];
  onSelectTicker: (ticker: string) => void;
  onAddToWatchlist: (ticker: string) => void;
}) {
  const { firebaseUser, authFetch } = useAuth();
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<'investScore' | 'pe' | 'roe' | 'dy' | 'revCagr' | 'marketCap'>(
    'investScore'
  );
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [savedList, setSavedList] = useState<SavedScreenerRow[]>([]);
  const [filterName, setFilterName] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setSavedList([]);
      return;
    }
    authFetch('/api/screeners')
      .then((r) => (r.ok ? r.json() : { screeners: [] }))
      .then((d) => setSavedList(d.screeners || []))
      .catch(() => {});
  }, [firebaseUser, authFetch]);

  const handleSaveScreener = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      setSaveMessage('Faça login para salvar filtros personalizados no banco de dados.');
      return;
    }
    if (!filterName.trim()) return;
    const res = await authFetch('/api/screeners', {
      method: 'POST',
      body: JSON.stringify({ name: filterName.trim(), filters }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedList((prev) => [data.screener, ...prev]);
      setFilterName('');
      setSaveMessage('Filtro salvo na sua conta.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const results = useMemo(() => {
    const num = (s: string) => (s.trim() === '' ? null : Number(s));
    const minPe = num(filters.minPe);
    const maxPe = num(filters.maxPe);
    const maxPb = num(filters.maxPb);
    const minRoe = num(filters.minRoe);
    const minRoic = num(filters.minRoic);
    const minMargin = num(filters.minNetMargin);
    const minRev = num(filters.minRevCagr);
    const minEarn = num(filters.minEarnCagr);
    const minDy = num(filters.minDy);
    const maxDebt = num(filters.maxNetDebtEbitda);
    const minCapM = num(filters.minMarketCapB) !== null ? num(filters.minMarketCapB)! * 1000 : null;

    const filtered = equities.filter((e) => {
      const m = e.metricsSummary;
      if (filters.market !== 'ALL' && e.market !== filters.market) return false;
      if (minPe !== null && (m.pe === null || m.pe < minPe)) return false;
      if (maxPe !== null && (m.pe === null || m.pe > maxPe)) return false;
      if (maxPb !== null && (m.pb === null || m.pb > maxPb)) return false;
      if (minRoe !== null && (m.roe === null || m.roe < minRoe)) return false;
      if (minRoic !== null && (m.roic === null || m.roic < minRoic)) return false;
      if (minMargin !== null && (m.netMargin === null || m.netMargin < minMargin)) return false;
      if (minRev !== null && (m.revenueCagr5y === null || m.revenueCagr5y < minRev)) return false;
      if (minEarn !== null && (m.earningsCagr5y === null || m.earningsCagr5y < minEarn)) return false;
      if (minDy !== null && (m.dividendYield === null || m.dividendYield < minDy)) return false;
      if (maxDebt !== null && m.netDebtEbitda !== null && m.netDebtEbitda > maxDebt) return false;
      if (minCapM !== null && e.marketCapMillions < minCapM) return false;
      if (filters.onlyPositiveFcf && (m.fcfMillions === null || m.fcfMillions <= 0)) return false;
      if (filters.aboveSma200 && !m.aboveSma200) return false;
      if (filters.macdPositive && !m.macdPositive) return false;
      if (filters.volumeAboveAvg && !m.volumeAboveAvg) return false;
      if (filters.rsiFilter === 'OVERSOLD' && m.rsi14 > 35) return false;
      if (filters.rsiFilter === 'NEUTRAL' && (m.rsi14 <= 35 || m.rsi14 >= 65)) return false;
      if (filters.rsiFilter === 'OVERBOUGHT' && m.rsi14 < 65) return false;
      if (filters.specialTag && !e.tags.includes(filters.specialTag)) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const getVal = (eq: EquityOverview) => {
        switch (sortBy) {
          case 'investScore':
            return eq.investScore.totalScore;
          case 'pe':
            return eq.metricsSummary.pe ?? 999;
          case 'roe':
            return eq.metricsSummary.roe ?? -999;
          case 'dy':
            return eq.metricsSummary.dividendYield ?? 0;
          case 'revCagr':
            return eq.metricsSummary.revenueCagr5y ?? -999;
          case 'marketCap':
            return eq.marketCapMillions;
        }
      };
      const diff = getVal(a) - getVal(b);
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [equities, filters, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
            Stock Screener — Buscador Inteligente de Ações
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Filtros combinados fundamentalistas, de crescimento, técnicos e temáticos para B3, NYSE e NASDAQ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Filtros
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        {/* Market & Special Themes */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(['ALL', 'B3', 'US'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, market: m }))}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  filters.market === m
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {m === 'ALL' ? 'Todos os Mercados' : m === 'B3' ? 'Brasil (B3)' : 'EUA (NYSE/NASDAQ)'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SPECIAL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setFilters((f) => ({ ...f, specialTag: f.specialTag === tag ? '' : tag }))
                }
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filters.specialTag === tag
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Numeric Fundamental & Growth Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'P/L Mín.', key: 'minPe', placeholder: 'Ex: 4' },
            { label: 'P/L Máx.', key: 'maxPe', placeholder: 'Ex: 15' },
            { label: 'P/VP Máx.', key: 'maxPb', placeholder: 'Ex: 2.0' },
            { label: 'ROE Mín. (%)', key: 'minRoe', placeholder: 'Ex: 15' },
            { label: 'ROIC Mín. (%)', key: 'minRoic', placeholder: 'Ex: 12' },
            { label: 'Margem Líq. Mín. (%)', key: 'minNetMargin', placeholder: 'Ex: 10' },
            { label: 'CAGR Rec. Mín. (%)', key: 'minRevCagr', placeholder: 'Ex: 10, 20, 30' },
            { label: 'CAGR Lucro Mín. (%)', key: 'minEarnCagr', placeholder: 'Ex: 15' },
            { label: 'Dividend Yield Mín. (%)', key: 'minDy', placeholder: 'Ex: 5' },
            { label: 'Dív. Líq./EBITDA Máx.', key: 'maxNetDebtEbitda', placeholder: 'Ex: 2.5' },
            { label: 'Valor Mercado Mín. (Bi)', key: 'minMarketCapB', placeholder: 'Ex: 10' },
          ].map((field) => (
            <label key={field.key} className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {field.label}
              </span>
              <input
                type="number"
                step="any"
                value={String(filters[field.key as keyof ScreenerFilters])}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          ))}

          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              RSI (14 períodos)
            </span>
            <select
              value={filters.rsiFilter}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  rsiFilter: e.target.value as ScreenerFilters['rsiFilter'],
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">Qualquer RSI</option>
              <option value="OVERSOLD">Sobrevendido (≤ 35)</option>
              <option value="NEUTRAL">Neutro (35–65)</option>
              <option value="OVERBOUGHT">Sobrecomprado (≥ 65)</option>
            </select>
          </label>
        </div>

        {/* Technical & Cash Flow Toggles + Save Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
            {[
              { key: 'onlyPositiveFcf', label: 'FCF Positivo' },
              { key: 'aboveSma200', label: 'Acima da Média Móvel 200d' },
              { key: 'macdPositive', label: 'MACD Positivo' },
              { key: 'volumeAboveAvg', label: 'Volume Acima da Média' },
            ].map((chk) => (
              <label key={chk.key} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(filters[chk.key as keyof ScreenerFilters])}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [chk.key]: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{chk.label}</span>
              </label>
            ))}
          </div>

          <form onSubmit={handleSaveScreener} className="flex items-center gap-2">
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Nome do filtro para salvar..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Filtro
            </button>
          </form>
        </div>

        {saveMessage && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400">{saveMessage}</div>
        )}

        {savedList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtros Salvos:
            </span>
            {savedList.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, ...s.filters })}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-white">
            {results.length} {results.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Clique nos cabeçalhos para ordenar · Clique no ticker para abrir análise
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nenhuma ação atendeu simultaneamente a todos os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Resetar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 px-3">Ativo</th>
                  <th className="text-left py-2.5 px-3">Mercado / Setor</th>
                  <th className="text-right py-2.5 px-3">Cotação</th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('marketCap')} className="hover:text-slate-900 dark:hover:text-white">
                      Val. Merc.
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('pe')} className="hover:text-slate-900 dark:hover:text-white">
                      P/L
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">P/VP</th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('roe')} className="hover:text-slate-900 dark:hover:text-white">
                      ROE
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('revCagr')} className="hover:text-slate-900 dark:hover:text-white">
                      CAGR Rec.
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('dy')} className="hover:text-slate-900 dark:hover:text-white">
                      DY
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">RSI(14)</th>
                  <th className="text-right py-2.5 px-3">
                    <button type="button" onClick={() => toggleSort('investScore')} className="hover:text-slate-900 dark:hover:text-white font-semibold text-emerald-600 dark:text-emerald-400">
                      INVEST SCORE
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {results.map((eq) => {
                  const m = eq.metricsSummary;
                  return (
                    <tr
                      key={eq.ticker}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectTicker(eq.ticker)}
                          className="text-left group"
                        >
                          <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                            {eq.ticker}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                            {eq.name}
                          </div>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {eq.exchange} · {eq.sector}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(eq.price, eq.currency)}
                        </div>
                        <div
                          className={`text-[11px] ${
                            eq.changePct >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatPct(eq.changePct, true)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCompactCap(eq.marketCapMillions, eq.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.pe !== null ? `${m.pe.toFixed(1)}x` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.pb !== null ? `${m.pb.toFixed(2)}x` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.roe !== null ? `${m.roe.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.revenueCagr5y !== null ? `${m.revenueCagr5y.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.dividendYield !== null ? `${m.dividendYield.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.rsi14.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {eq.investScore.totalScore}/100
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onAddToWatchlist(eq.ticker)}
                          title="Adicionar à Watchlist"
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
