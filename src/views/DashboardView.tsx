import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Calendar, Globe, Newspaper, RefreshCw } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';
import type {
  EconomicCalendarEvent,
  EquityOverview,
  MarketIndexQuote,
  NewsItem,
} from '../shared/types';
import {
  formatCurrency,
  formatFeedStatusLabel,
  formatPct,
  formatTimestampBRT,
} from '../utils/formatters';

interface DashboardViewProps {
  indices: MarketIndexQuote[];
  highlights: {
    brGainers: EquityOverview[];
    brLosers: EquityOverview[];
    brMostActive: EquityOverview[];
    usGainers: EquityOverview[];
    usLosers: EquityOverview[];
    usMostActive: EquityOverview[];
  } | null;
  news: NewsItem[];
  calendar: EconomicCalendarEvent[];
  usdBrl: { rate: number; source: string; feedStatus: string } | null;
  updatedAt: string;
  loading: boolean;
  onRefresh: () => void;
  onSelectTicker: (ticker: string) => void;
  onNavigateModule: (tab: string) => void;
}

export function DashboardView({
  indices,
  highlights,
  news,
  calendar,
  usdBrl,
  updatedAt,
  loading,
  onRefresh,
  onSelectTicker,
  onNavigateModule,
}: DashboardViewProps) {
  const [marketFocus, setMarketFocus] = useState<'ALL' | 'B3' | 'US'>('ALL');
  const [moverTab, setMoverTab] = useState<'gainers' | 'losers' | 'active'>('gainers');

  const brIndices = useMemo(() => indices.filter((i) => i.market === 'B3'), [indices]);
  const usIndices = useMemo(() => indices.filter((i) => i.market === 'US'), [indices]);

  const formatIndexValue = (idx: MarketIndexQuote) => {
    if (idx.unit === '%') return `${idx.value.toFixed(2)}%`;
    if (idx.unit === 'BRL') return `R$ ${idx.value.toFixed(2)}`;
    if (idx.unit === 'idx') return idx.value.toFixed(2);
    return idx.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  };

  const renderMoverRows = (list: EquityOverview[]) => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
      {list.map((eq) => {
        const up = eq.changePct >= 0;
        return (
          <button
            key={eq.ticker}
            type="button"
            onClick={() => onSelectTicker(eq.ticker)}
            className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <div className="min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  {eq.ticker}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {eq.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {eq.sector} · Score {eq.investScore.totalScore}/100
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(eq.price, eq.currency)}
              </div>
              <div
                className={`inline-flex items-center justify-end gap-0.5 font-mono text-xs font-medium tabular-nums ${
                  up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPct(eq.changePct, true)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header & Market Provenance Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel Global de Mercados
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Brasil (B3) & Estados Unidos (NYSE / NASDAQ) · Última atualização:{' '}
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {updatedAt ? formatTimestampBRT(updatedAt) : 'Carregando...'}
            </span>
            {usdBrl && (
              <>
                {' · '}USD/BRL:{' '}
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  R$ {usdBrl.rate.toFixed(2)}
                </span>{' '}
                ({usdBrl.source})
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(
              [
                { id: 'ALL', label: 'Todos' },
                { id: 'B3', label: 'Brasil (B3)' },
                { id: 'US', label: 'EUA (NYSE/NASDAQ)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMarketFocus(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  marketFocus === opt.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Brazilian Market Grid */}
      {(marketFocus === 'ALL' || marketFocus === 'B3') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Mercado Brasileiro — Índices & Macroeconomia
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Fontes: Banco Central do Brasil (SGS) · Yahoo Finance / Referência B3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {brIndices.map((idx) => {
              const up = idx.changePct >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {idx.name}
                      </div>
                      <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                        {formatIndexValue(idx)}
                      </div>
                    </div>
                    <Sparkline data={idx.sparkline} positive={up} width={72} height={26} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`font-mono font-medium inline-flex items-center gap-0.5 tabular-nums ${
                        idx.changePct === 0
                          ? 'text-slate-500 dark:text-slate-400'
                          : up
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {idx.changePct > 0 ? '+' : ''}
                      {idx.changePct.toFixed(2)}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate ml-2">
                      {formatFeedStatusLabel(idx.feedStatus)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* US Market Grid */}
      {(marketFocus === 'ALL' || marketFocus === 'US') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              Mercado Americano — NYSE, NASDAQ & Renda Fixa Global
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Fontes: Yahoo Finance · US Treasury / CBOE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {usIndices.map((idx) => {
              const isVix = idx.symbol === '^VIX';
              const up = isVix ? idx.changePct <= 0 : idx.changePct >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {idx.name}
                      </div>
                      <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                        {formatIndexValue(idx)}
                      </div>
                    </div>
                    <Sparkline data={idx.sparkline} positive={up} width={72} height={26} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`font-mono font-medium tabular-nums ${
                        idx.changePct >= 0
                          ? isVix
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                          : isVix
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {idx.changePct > 0 ? '+' : ''}
                      {idx.changePct.toFixed(2)}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate ml-2">
                      {formatFeedStatusLabel(idx.feedStatus)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Movers: Gainers, Losers & Most Active */}
      {highlights && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Destaques do Pregão — B3 e EUA
            </h2>
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              {(
                [
                  { id: 'gainers', label: 'Maiores Altas' },
                  { id: 'losers', label: 'Maiores Baixas' },
                  { id: 'active', label: 'Mais Negociadas' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMoverTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    moverTab === t.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Brasil — B3
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Clique no ativo para abrir análise completa
                </span>
              </div>
              {renderMoverRows(
                moverTab === 'gainers'
                  ? highlights.brGainers
                  : moverTab === 'losers'
                  ? highlights.brLosers
                  : highlights.brMostActive
              )}
            </div>

            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Estados Unidos — NYSE & NASDAQ
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Cotação em USD
                </span>
              </div>
              {renderMoverRows(
                moverTab === 'gainers'
                  ? highlights.usGainers
                  : moverTab === 'losers'
                  ? highlights.usLosers
                  : highlights.usMostActive
              )}
            </div>
          </div>
        </section>
      )}

      {/* News & Upcoming Economic Calendar Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-500" />
              Radar de Notícias & Impacto Setorial
            </h2>
            <button
              type="button"
              onClick={() => onNavigateModule('news')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              Ver central completa
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {news.slice(0, 4).map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.category} · {item.source} · {item.publishedAt}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Impacto:</strong>{' '}
                  {item.aiImpactNote}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {item.affectedTickers.map((tk) => (
                    <button
                      key={tk}
                      type="button"
                      onClick={() => onSelectTicker(tk)}
                      className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Agenda Econômica & Balanços
            </h2>
            <button
              type="button"
              onClick={() => onNavigateModule('news')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              Agenda completa
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendar.slice(0, 5).map((ev) => (
              <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono">
                    {ev.date} · {ev.time}
                  </span>
                  <span>
                    {ev.country} · {ev.importance}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                  {ev.event}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Anterior: {ev.previous} · Projeção: {ev.forecast}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
