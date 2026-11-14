import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookmarkPlus,
  Calculator,
  ChevronDown,
  ChevronUp,
  Cpu,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { FinancialChart } from '../components/FinancialChart';
import type { EquityFullDetail, EquityOverview, FundamentalMetricDetail } from '../shared/types';
import {
  formatCompactCap,
  formatCurrency,
  formatFeedStatusLabel,
  formatTimestampBRT,
} from '../utils/formatters';

interface StockDetailViewProps {
  ticker: string;
  allEquities: EquityOverview[];
  onSelectTicker: (ticker: string) => void;
  onOpenAIReport: (ticker: string) => void;
  onOpenValuation: (ticker: string) => void;
  onAddToWatchlist: (ticker: string) => void;
}

export function StockDetailView({
  ticker,
  allEquities,
  onSelectTicker,
  onOpenAIReport,
  onOpenValuation,
  onAddToWatchlist,
}: StockDetailViewProps) {
  const [detail, setDetail] = useState<EquityFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(ticker);
  const [statementMode, setStatementMode] = useState<'annual' | 'quarterly'>('annual');
  const [expandedMetric, setExpandedMetric] = useState<string | null>('pe');
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'fundamentals' | 'statements' | 'dividends'
  >('overview');

  useEffect(() => {
    setSearchInput(ticker);
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/equities/${encodeURIComponent(ticker)}?range=2y`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Ativo não encontrado.');
        }
        return res.json();
      })
      .then((data: EquityFullDetail) => {
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Erro ao carregar ativo.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) onSelectTicker(clean);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-96 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
        <p className="text-base font-semibold text-rose-600 dark:text-rose-400">
          {error || 'Ativo não encontrado.'}
        </p>
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Digite um ticker (ex: ITUB4, PETR4, NVDA, AAPL)"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Buscar
          </button>
        </form>
      </div>
    );
  }

  const up = detail.changePct >= 0;
  const range52w = detail.high52w - detail.low52w || 1;
  const pos52w = Math.max(0, Math.min(100, ((detail.price - detail.low52w) / range52w) * 100));
  const statements =
    statementMode === 'annual' ? detail.statementsAnnual : detail.statementsQuarterly;

  const renderMetricCard = (m: FundamentalMetricDetail) => {
    const isExpanded = expandedMetric === m.key;
    const signalColor =
      m.signal === 'favorable'
        ? 'text-emerald-600 dark:text-emerald-400'
        : m.signal === 'caution'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-500 dark:text-slate-400';

    return (
      <div
        key={m.key}
        className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
      >
        <button
          type="button"
          onClick={() => setExpandedMetric(isExpanded ? null : m.key)}
          className="w-full flex items-start justify-between gap-2 text-left"
        >
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {m.label}
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {m.formattedValue}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-medium ${signalColor}`}>
              {m.signal === 'favorable'
                ? 'Favorável'
                : m.signal === 'caution'
                ? 'Atenção'
                : m.signal === 'na'
                ? 'N/A'
                : 'Neutro'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            Média Hist.:{' '}
            {m.historicalMean !== null
              ? `${m.historicalMean}${m.unit === 'x' || m.unit === '%' ? m.unit : ''}`
              : 'N/A'}
          </span>
          <span>
            Setor:{' '}
            {m.sectorAverage !== null
              ? `${m.sectorAverage}${m.unit === 'x' || m.unit === '%' ? m.unit : ''}`
              : 'N/A'}
          </span>
        </div>

        {isExpanded && (
          <div className="pt-2 space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-100">O que significa:</strong>{' '}
              {m.didacticExplanation}
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-100">Interpretação:</strong>{' '}
              {m.interpretation}
            </p>
            {m.historicalSeries.some((p) => p.value !== null) && (
              <div className="pt-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  Evolução Histórica (últimos períodos)
                </div>
                <div className="grid grid-cols-7 gap-1 items-end h-14">
                  {m.historicalSeries.map((pt) => {
                    const maxV = Math.max(
                      ...m.historicalSeries.map((x) => Math.abs(x.value ?? 0)),
                      1
                    );
                    const hPct = pt.value !== null ? Math.max(12, (Math.abs(pt.value) / maxV) * 100) : 8;
                    return (
                      <div key={pt.period} className="flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full bg-emerald-500/70 dark:bg-emerald-400/70 rounded-t-xs"
                          style={{ height: `${hPct}%` }}
                          title={`${pt.period}: ${pt.value}`}
                        />
                        <span className="text-[9px] font-mono text-slate-400">{pt.period}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Quick Ticker Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar qualquer ticker B3 ou EUA (ex: ITUB4, NVDA)..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 dark:bg-emerald-600 text-white hover:opacity-90 whitespace-nowrap shrink-0"
          >
            Consultar
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['ITUB4', 'PETR4', 'VALE3', 'WEGE3', 'BBAS3', 'NVDA', 'AAPL', 'MSFT', 'GOOGL'].map(
            (tk) => (
              <button
                key={tk}
                type="button"
                onClick={() => onSelectTicker(tk)}
                className={`px-2.5 py-1 font-mono rounded-md border transition-colors ${
                  tk === detail.ticker
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tk}
              </button>
            )
          )}
        </div>
      </div>

      {/* Company Hero Summary */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {detail.exchange} · {detail.sector} · {detail.segment} ·{' '}
              {formatFeedStatusLabel(detail.feedStatus)} ({formatTimestampBRT(detail.updatedAt)})
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {detail.name}
              </h1>
              <span className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {detail.ticker}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              {detail.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(detail.price, detail.currency)}
              </span>
              <span
                className={`inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
                  up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {up ? '+' : ''}
                {detail.change.toFixed(2)} ({up ? '+' : ''}
                {detail.changePct.toFixed(2)}%)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onAddToWatchlist(detail.ticker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Watchlist
              </button>
              <button
                type="button"
                onClick={() => onOpenValuation(detail.ticker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                <Calculator className="w-3.5 h-3.5" />
                Calcular Preço Justo
              </button>
              <button
                type="button"
                onClick={() => onOpenAIReport(detail.ticker)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap shrink-0"
              >
                <Cpu className="w-3.5 h-3.5" />
                Relatório Analista IA
              </button>
            </div>
          </div>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Valor de Mercado</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {formatCompactCap(detail.marketCapMillions, detail.currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Volume Diário</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {detail.currency === 'BRL' ? 'R$' : 'US$'} {detail.volumeMillions.toFixed(1)} mi
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Nº de Ações</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {detail.sharesOutstandingMillions
                ? `${detail.sharesOutstandingMillions.toLocaleString('pt-BR')} mi`
                : 'N/D'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Free Float</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {detail.freeFloatPct ? `${detail.freeFloatPct.toFixed(1)}%` : 'N/D'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Beta · RSI(14)</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {detail.beta.toFixed(2)} · {detail.metricsSummary.rsi14.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">INVEST SCORE</div>
            <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              {detail.investScore.totalScore}/100 · {detail.investScore.classification}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Faixa 52 Semanas</div>
            <div className="mt-1 space-y-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${pos52w}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
                <span>{detail.low52w.toFixed(2)}</span>
                <span>{detail.high52w.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
        {(
          [
            { id: 'overview', label: 'Gráfico & INVEST SCORE' },
            { id: 'fundamentals', label: `Indicadores Fundamentalistas (${detail.fundamentals.length})` },
            { id: 'statements', label: 'Demonstrativos Financeiros' },
            { id: 'dividends', label: 'Dividendos & Proventos' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <FinancialChart
            ticker={detail.ticker}
            currency={detail.currency}
            bars={detail.priceHistory}
            allEquities={allEquities}
          />

          {/* Proprietary INVEST SCORE Breakdown */}
          {detail.investScore.pillars.length > 0 && (
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    INVEST SCORE — Metodologia Setorial Transparente
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {detail.investScore.methodologyNote} · Referência: {detail.investScore.referenceDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {detail.investScore.totalScore}/100
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Classificação: {detail.investScore.classification}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {detail.investScore.pillars.map((p) => (
                  <div
                    key={p.key}
                    className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {p.label}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {p.score}/100
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.score >= 75
                            ? 'bg-emerald-500'
                            : p.score >= 55
                            ? 'bg-sky-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Peso setorial: {p.weightPct}% · {p.rationale}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    Principais Pontos Fortes
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                    {detail.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                    Principais Riscos & Pontos de Atenção
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                    {detail.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'fundamentals' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Clique em qualquer indicador para expandir a explicação didática, interpretação automática e histórico de evolução. Data de referência: {detail.referenceStatementDate}.
          </div>
          {detail.fundamentals.length === 0 ? (
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-sm text-slate-500">
              Indicadores fundamentalistas detalhados ainda não indexados para este ativo consultado externamente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detail.fundamentals.map(renderMetricCard)}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'statements' && (
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Demonstrativos Financeiros (DRE, Balanço e Fluxo de Caixa)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Valores expressos em milhões de {detail.currency === 'BRL' ? 'Reais (R$)' : 'Dólares (US$)'}
              </p>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <button
                type="button"
                onClick={() => setStatementMode('annual')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  statementMode === 'annual'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Anual (7 anos)
              </button>
              <button
                type="button"
                onClick={() => setStatementMode('quarterly')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  statementMode === 'quarterly'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Trimestral
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold">Conta / Período</th>
                  {statements.map((st) => (
                    <th key={st.period} className="text-right py-2.5 px-3 font-mono font-semibold">
                      {st.period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(
                  [
                    { label: 'Receita Líquida', key: 'revenue' },
                    { label: 'Lucro Bruto', key: 'grossProfit' },
                    { label: 'EBITDA', key: 'ebitda' },
                    { label: 'EBIT', key: 'ebit' },
                    { label: 'Lucro Líquido', key: 'netIncome' },
                    { label: 'Ativos Totais', key: 'assets' },
                    { label: 'Passivos Totais', key: 'liabilities' },
                    { label: 'Patrimônio Líquido', key: 'equity' },
                    { label: 'Dívida Bruta', key: 'grossDebt' },
                    { label: 'Dívida Líquida', key: 'netDebt' },
                    { label: 'Fluxo de Caixa Operacional', key: 'operatingCashFlow' },
                    { label: 'Investimentos (CAPEX)', key: 'capex' },
                    { label: 'Fluxo de Caixa Livre (FCF)', key: 'freeCashFlow' },
                  ] as const
                ).map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {row.label}
                    </td>
                    {statements.map((st) => (
                      <td
                        key={st.period}
                        className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300"
                      >
                        {st[row.key].toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'dividends' && (
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Histórico de Proventos ({detail.market === 'B3' ? 'Dividendos & JCP' : 'Cash Dividends'})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequência: {detail.dividendFrequency} · Dividend Yield 12M:{' '}
                {(detail.metricsSummary.dividendYield ?? 0).toFixed(2)}%
              </p>
            </div>
          </div>

          {detail.dividends.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Esta empresa prioriza reinvestimento de lucros e/ou recompras de ações sem histórico recente de proventos em dinheiro.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 px-4">Tipo</th>
                  <th className="text-left py-2.5 px-4">Data-Com / Ex-Date</th>
                  <th className="text-left py-2.5 px-4">Data de Pagamento</th>
                  <th className="text-right py-2.5 px-4">Valor por Ação</th>
                  <th className="text-right py-2.5 px-4">Yield na Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {detail.dividends.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {d.type}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {d.exDate}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {d.paymentDate}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(d.amountPerShare, d.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {d.yieldOnDatePct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
