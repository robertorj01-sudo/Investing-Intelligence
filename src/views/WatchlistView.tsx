import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Bookmark, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { EquityOverview } from '../shared/types';
import { formatCurrency, formatPct } from '../utils/formatters';

interface WatchlistRow {
  id: number;
  name: string;
  description: string;
}

interface WatchlistItemRow {
  id: number;
  watchlistId: number;
  ticker: string;
  targetPrice: number | null;
  alertPctChange: number | null;
  alertRsiBelow: number | null;
  alertRsiAbove: number | null;
  notifyEarnings: boolean;
  notifyDividends: boolean;
  equity: EquityOverview | null;
  triggeredAlerts: string[];
}

export function WatchlistView({
  equities,
  pendingAddTicker,
  onClearPendingAdd,
  onSelectTicker,
}: {
  equities: EquityOverview[];
  pendingAddTicker?: string | null;
  onClearPendingAdd?: () => void;
  onSelectTicker: (ticker: string) => void;
}) {
  const { firebaseUser, loginWithGoogle, authFetch } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistRow[]>([]);
  const [items, setItems] = useState<WatchlistItemRow[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState('');

  const [ticker, setTicker] = useState(pendingAddTicker || 'ITUB4');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertPctChange, setAlertPctChange] = useState('3');
  const [alertRsiBelow, setAlertRsiBelow] = useState('35');
  const [alertRsiAbove, setAlertRsiAbove] = useState('75');

  useEffect(() => {
    if (pendingAddTicker) {
      setTicker(pendingAddTicker);
      onClearPendingAdd?.();
    }
  }, [pendingAddTicker, onClearPendingAdd]);

  const loadData = useCallback(async () => {
    if (!firebaseUser) return;
    const res = await authFetch('/api/watchlists');
    if (res.ok) {
      const data = await res.json();
      setWatchlists(data.watchlists || []);
      setItems(data.items || []);
      if (data.watchlists?.length > 0 && !activeListId) {
        setActiveListId(data.watchlists[0].id);
      }
    }
  }, [firebaseUser, authFetch, activeListId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const res = await authFetch('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name: newListName.trim(), description: 'Lista personalizada' }),
    });
    if (res.ok) {
      const d = await res.json();
      setNewListName('');
      await loadData();
      setActiveListId(d.watchlist.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId) return;
    const res = await authFetch(`/api/watchlists/${activeListId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        ticker,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        alertPctChange: alertPctChange ? Number(alertPctChange) : null,
        alertRsiBelow: alertRsiBelow ? Number(alertRsiBelow) : null,
        alertRsiAbove: alertRsiAbove ? Number(alertRsiAbove) : null,
        notifyEarnings: true,
        notifyDividends: true,
      }),
    });
    if (res.ok) {
      setTargetPrice('');
      await loadData();
    }
  };

  const handleDelete = async (id: number) => {
    const res = await authFetch(`/api/watchlists/items/${id}`, { method: 'DELETE' });
    if (res.ok) await loadData();
  };

  if (!firebaseUser) {
    return (
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-4 max-w-xl mx-auto mt-8">
        <Bookmark className="w-10 h-10 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Watchlist & Alertas Inteligentes
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Faça login com sua conta Google para criar listas de acompanhamento personalizadas (Dividendos, Growth, Small Caps, EUA) com alertas automáticos de preço-alvo, RSI, variação percentual, resultados e dividendos.
        </p>
        <button
          type="button"
          onClick={loginWithGoogle}
          className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  const activeItems = items.filter((i) => i.watchlistId === activeListId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            Watchlists & Alertas Configuráveis
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Monitore oportunidades por preço-alvo, variação diária, RSI e eventos corporativos.
          </p>
        </div>

        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nova lista (ex: Ações para Comprar)..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-emerald-600 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Lista
          </button>
        </form>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex flex-wrap gap-2">
        {watchlists.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActiveListId(w.id)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border ${
              w.id === activeListId
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-[#0F1623] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Add / Update Alert Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs items-end"
      >
        <label className="space-y-1">
          <span className="text-slate-500">Ativo</span>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          >
            {equities.map((e) => (
              <option key={e.ticker} value={e.ticker}>
                {e.ticker} — {e.name.slice(0, 18)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-slate-500">Preço-Alvo Compra</span>
          <input
            type="number"
            step="any"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="Opcional"
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-500">Alerta Δ Diária (%)</span>
          <input
            type="number"
            step="0.5"
            value={alertPctChange}
            onChange={(e) => setAlertPctChange(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-500">RSI Sobrevenda ≤</span>
          <input
            type="number"
            value={alertRsiBelow}
            onChange={(e) => setAlertRsiBelow(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-500">RSI Sobrecompra ≥</span>
          <input
            type="number"
            value={alertRsiAbove}
            onChange={(e) => setAlertRsiAbove(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          Salvar Alerta
        </button>
      </form>

      {/* Watchlist Items Table */}
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-left">Ticker / Empresa</th>
                <th className="py-2.5 px-3 text-right">Cotação</th>
                <th className="py-2.5 px-3 text-right">Variação</th>
                <th className="py-2.5 px-3 text-right">Preço-Alvo</th>
                <th className="py-2.5 px-3 text-right">RSI(14)</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-4 text-left">Alertas Disparados / Configurados</th>
                <th className="py-2.5 px-4 text-right">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activeItems.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectTicker(it.ticker)}
                      className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-500"
                    >
                      {it.ticker}
                    </button>
                    <div className="text-[11px] text-slate-500">{it.equity?.name || it.ticker}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {it.equity ? formatCurrency(it.equity.price, it.equity.currency) : '—'}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                      (it.equity?.changePct ?? 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {it.equity ? formatPct(it.equity.changePct, true) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {it.targetPrice && it.equity
                      ? formatCurrency(it.targetPrice, it.equity.currency)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {it.equity ? it.equity.metricsSummary.rsi14.toFixed(1) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                    {it.equity ? `${it.equity.investScore.totalScore}/100` : '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    {it.triggeredAlerts.length > 0 ? (
                      <div className="text-amber-600 dark:text-amber-400 font-medium">
                        {it.triggeredAlerts.join(' · ')}
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400">
                        Monitorando Δ≥{it.alertPctChange ?? 3}% · RSI {it.alertRsiBelow ?? 35}–{it.alertRsiAbove ?? 75} · Balanços & Proventos
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label="Remover da watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum ativo nesta watchlist. Adicione acima.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
