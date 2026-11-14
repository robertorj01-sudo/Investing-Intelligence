import React, { useMemo, useState } from 'react';
import { Calendar, Newspaper } from 'lucide-react';
import type { EconomicCalendarEvent, NewsItem } from '../shared/types';

const NEWS_CATEGORIES = [
  'Todas',
  'Brasil',
  'Estados Unidos',
  'Empresas',
  'Tecnologia',
  'Economia',
  'Política Monetária',
  'Resultados Corporativos',
  'Commodities',
] as const;

export function NewsCalendarView({
  news,
  calendar,
  onSelectTicker,
}: {
  news: NewsItem[];
  calendar: EconomicCalendarEvent[];
  onSelectTicker: (ticker: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [calendarCountry, setCalendarCountry] = useState<'ALL' | 'BR' | 'US'>('ALL');

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'Todas') return news;
    return news.filter((n) => n.category === selectedCategory);
  }, [news, selectedCategory]);

  const filteredCalendar = useMemo(() => {
    if (calendarCountry === 'ALL') return calendar;
    return calendar.filter((c) => c.country === calendarCountry);
  }, [calendar, calendarCountry]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-500" />
          Central de Notícias & Calendário Econômico
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Sínteses analíticas com mapeamento de impacto por setor e empresa, acompanhadas da agenda de FED, Banco Central, Payroll, CPI, PCE, resultados e dividendos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-[#0F1623] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredNews.length === 0 ? (
              <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-xs text-slate-500">
                Nenhuma notícia nesta categoria no momento.
              </div>
            ) : (
              filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.category} · Fonte: {item.source} · {item.publishedAt}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Síntese de Impacto (IA):
                    </strong>{' '}
                    {item.aiImpactNote}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Setores: {item.affectedSectors.join(', ')}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.affectedTickers.map((tk) => (
                        <button
                          key={tk}
                          type="button"
                          onClick={() => onSelectTicker(tk)}
                          className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {tk}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Economic Calendar Column */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                Calendário Econômico & Corporativo
              </h2>
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[11px]">
                {(['ALL', 'BR', 'US'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCalendarCountry(c)}
                    className={`px-2 py-1 rounded-md font-medium ${
                      calendarCountry === c
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {c === 'ALL' ? 'Todos' : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCalendar.map((ev) => (
                <div key={ev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      {ev.date} · {ev.time}
                    </span>
                    <span
                      className={
                        ev.importance === 'Alta'
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      {ev.country} · {ev.importance}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {ev.event}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {ev.category} · Ant.: {ev.previous} · Est.: {ev.forecast}
                    </span>
                    {ev.relatedTicker && (
                      <button
                        type="button"
                        onClick={() => onSelectTicker(ev.relatedTicker!)}
                        className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {ev.relatedTicker}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
