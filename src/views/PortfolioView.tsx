import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { EquityOverview } from '../shared/types';
import { formatCurrency, formatPct } from '../utils/formatters';

interface PortfolioAnalyticsBundle {
  id: number;
  name: string;
  strategy: string;
  baseCurrency: string;
  transactions: {
    id: number;
    ticker: string;
    market: string;
    type: string;
    quantity: number;
    price: number;
    currency: string;
    fees: number;
    executedAt: string;
    notes: string;
  }[];
  analytics: {
    summary: {
      totalValueBrl: number;
      totalValueUsd: number;
      totalCostBrl: number;
      unrealizedPnlBrl: number;
      realizedPnlBrl: number;
      dividendsBrl: number;
      totalReturnPct: number;
      maxPositionWeightPct: number;
      concentrationAlert: string | null;
    };
    positions: {
      ticker: string;
      name: string;
      market: string;
      sector: string;
      currency: string;
      quantity: number;
      avgPriceNative: number;
      currentPriceNative: number;
      marketValueBrl: number;
      costBasisBrl: number;
      unrealizedPnlBrl: number;
      unrealizedPct: number;
      realizedPnlBrl: number;
      dividendsBrl: number;
      weightPct: number;
    }[];
    bySector: { name: string; valueBrl: number; pct: number }[];
    byCountry: { name: string; valueBrl: number; pct: number }[];
    byCurrency: { name: string; valueBrl: number; pct: number }[];
  };
}

export function PortfolioView({
  equities,
  onSelectTicker,
}: {
  equities: EquityOverview[];
  onSelectTicker: (ticker: string) => void;
}) {
  const { firebaseUser, loginWithGoogle, authFetch } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioAnalyticsBundle[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [usdBrl, setUsdBrl] = useState(5.78);
  const [loading, setLoading] = useState(false);

  // New portfolio form
  const [newPortName, setNewPortName] = useState('');
  const [newPortStrategy, setNewPortStrategy] = useState('Dividendos & Crescimento');

  // New transaction form
  const [txTicker, setTxTicker] = useState('ITUB4');
  const [txType, setTxType] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY');
  const [txQty, setTxQty] = useState('100');
  const [txPrice, setTxPrice] = useState('35.50');
  const [txFees, setTxFees] = useState('0');
  const [txDate, setTxDate] = useState('2026-11-10');
  const [error, setError] = useState<string | null>(null);

  const loadPortfolios = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data.portfolios || []);
        if (data.usdBrl?.rate) setUsdBrl(data.usdBrl.rate);
        if (data.portfolios?.length > 0 && !activeId) {
          setActiveId(data.portfolios[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, authFetch, activeId]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    const match = equities.find((e) => e.ticker === txTicker);
    if (match) setTxPrice(match.price.toFixed(2));
  }, [txTicker, equities]);

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortName.trim()) return;
    const res = await authFetch('/api/portfolios', {
      method: 'POST',
      body: JSON.stringify({
        name: newPortName.trim(),
        strategy: newPortStrategy.trim(),
        baseCurrency: 'BRL',
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setNewPortName('');
      await loadPortfolios();
      setActiveId(d.portfolio.id);
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    setError(null);
    const eq = equities.find((x) => x.ticker === txTicker);
    const res = await authFetch(`/api/portfolios/${activeId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        ticker: txTicker,
        market: eq?.market || (/^[A-Z]{4}\d+$/.test(txTicker) ? 'B3' : 'US'),
        type: txType,
        quantity: Number(txQty),
        price: Number(txPrice),
        currency: eq?.currency || (/^[A-Z]{4}\d+$/.test(txTicker) ? 'BRL' : 'USD'),
        fees: Number(txFees || 0),
        executedAt: txDate,
        notes: '',
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Erro ao registrar operação.');
      return;
    }
    await loadPortfolios();
  };

  const handleDeleteTx = async (txId: number) => {
    const res = await authFetch(`/api/portfolios/transactions/${txId}`, {
      method: 'DELETE',
    });
    if (res.ok) await loadPortfolios();
  };

  if (!firebaseUser) {
    return (
      <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-4 max-w-xl mx-auto mt-8">
        <Briefcase className="w-10 h-10 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Minha Carteira — Área Privada do Investidor
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Entre com sua conta Google para cadastrar múltiplas carteiras, registrar compras, vendas e dividendos em BRL e USD e acompanhar sua rentabilidade contra Ibovespa, CDI, IPCA e S&P 500.
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

  const activePortfolio = portfolios.find((p) => p.id === activeId) || portfolios[0];
  const sum = activePortfolio?.analytics.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-500" />
            Minha Carteira — Portfolio Tracker Multi-Moeda
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Conversão cambial automática USD/BRL: <span className="font-mono">R$ {usdBrl.toFixed(2)}</span> · Seus dados privados são protegidos por usuário.
          </p>
        </div>

        <form onSubmit={handleCreatePortfolio} className="flex items-center gap-2">
          <input
            type="text"
            value={newPortName}
            onChange={(e) => setNewPortName(e.target.value)}
            placeholder="Nova carteira (ex: Renda Global)..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-emerald-600 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Carteira
          </button>
        </form>
      </div>

      {/* Portfolio Tabs */}
      {portfolios.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {portfolios.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                p.id === activePortfolio?.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-[#0F1623] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {p.name} · {p.strategy}
            </button>
          ))}
        </div>
      )}

      {sum?.concentrationAlert && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sum.concentrationAlert}</span>
        </div>
      )}

      {/* Summary KPIs */}
      {sum && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Patrimônio Total</div>
            <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {formatCurrency(sum.totalValueBrl, 'BRL')}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              {formatCurrency(sum.totalValueUsd, 'USD')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Resultado Não Realizado</div>
            <div
              className={`font-mono text-xl font-bold mt-1 tabular-nums ${
                sum.unrealizedPnlBrl >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(sum.unrealizedPnlBrl, 'BRL')}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              Custo: {formatCurrency(sum.totalCostBrl, 'BRL')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Lucro Realizado + Divs.</div>
            <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {formatCurrency(sum.realizedPnlBrl + sum.dividendsBrl, 'BRL')}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              Proventos: {formatCurrency(sum.dividendsBrl, 'BRL')}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Rentabilidade Acumulada</div>
            <div
              className={`font-mono text-xl font-bold mt-1 tabular-nums ${
                sum.totalReturnPct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPct(sum.totalReturnPct, true)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Sobre capital alocado</div>
          </div>

          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Benchmarks (Ref. 12M)</div>
            <div className="font-mono text-xs text-slate-700 dark:text-slate-200 mt-1 space-y-0.5">
              <div>CDI: +11,1% · IPCA: +4,8%</div>
              <div>IBOV: +8,4% · S&P500: +24,2%</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      <form
        onSubmit={handleAddTx}
        className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
      >
        <div className="text-xs font-semibold text-slate-900 dark:text-white">
          Registrar Operação / Provento
        </div>
        {error && <div className="text-xs text-rose-500">{error}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <select
            value={txTicker}
            onChange={(e) => setTxTicker(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          >
            {equities.map((e) => (
              <option key={e.ticker} value={e.ticker}>
                {e.ticker} ({e.currency})
              </option>
            ))}
          </select>

          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value as 'BUY' | 'SELL' | 'DIVIDEND')}
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
          >
            <option value="BUY">Compra</option>
            <option value="SELL">Venda</option>
            <option value="DIVIDEND">Dividendo / JCP</option>
          </select>

          <input
            type="number"
            step="any"
            value={txQty}
            onChange={(e) => setTxQty(e.target.value)}
            placeholder="Quantidade"
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />

          <input
            type="number"
            step="any"
            value={txPrice}
            onChange={(e) => setTxPrice(e.target.value)}
            placeholder="Preço unitário"
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />

          <input
            type="number"
            step="any"
            value={txFees}
            onChange={(e) => setTxFees(e.target.value)}
            placeholder="Taxas / Corretagem"
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />

          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
          />

          <button
            type="submit"
            className="px-4 py-2 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>
      </form>

      {/* Positions & Exposures */}
      {activePortfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
              Posições Consolidadas ({activePortfolio.analytics.positions.length})
            </div>

            {loading ? (
              <div className="p-6 text-xs text-slate-500">Atualizando posições...</div>
            ) : activePortfolio.analytics.positions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Sua carteira ainda não possui posições. Registre sua primeira compra acima.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Ativo</th>
                      <th className="py-2.5 px-3 text-right">Qtd</th>
                      <th className="py-2.5 px-3 text-right">PM</th>
                      <th className="py-2.5 px-3 text-right">Atual</th>
                      <th className="py-2.5 px-3 text-right">Saldo (BRL)</th>
                      <th className="py-2.5 px-3 text-right">Resultado</th>
                      <th className="py-2.5 px-3 text-right">Peso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activePortfolio.analytics.positions.map((pos) => (
                      <tr key={pos.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onSelectTicker(pos.ticker)}
                            className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-500"
                          >
                            {pos.ticker}
                          </button>
                          <div className="text-[10px] text-slate-500">{pos.sector}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {pos.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(pos.avgPriceNative, pos.currency as 'BRL' | 'USD')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(pos.currentPriceNative, pos.currency as 'BRL' | 'USD')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                          {formatCurrency(pos.marketValueBrl, 'BRL')}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                            pos.unrealizedPnlBrl >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(pos.unrealizedPnlBrl, 'BRL')} ({formatPct(pos.unrealizedPct, true)})
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {pos.weightPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exposure Breakdown */}
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                Distribuição por País & Exposição Cambial
              </h3>
              <div className="space-y-2 text-xs">
                {activePortfolio.analytics.byCurrency.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>{c.name}</span>
                      <span>{c.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                Distribuição por Setor
              </h3>
              <div className="space-y-2 text-xs">
                {activePortfolio.analytics.bySector.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{s.name}</span>
                      <span className="font-mono">{s.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Ledger */}
      {activePortfolio && activePortfolio.transactions.length > 0 && (
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
            Histórico de Lançamentos
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-4 text-left">Data</th>
                  <th className="py-2 px-3 text-left">Tipo</th>
                  <th className="py-2 px-3 text-left">Ticker</th>
                  <th className="py-2 px-3 text-right">Qtd</th>
                  <th className="py-2 px-3 text-right">Preço</th>
                  <th className="py-2 px-3 text-right">Taxas</th>
                  <th className="py-2 px-4 text-right">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activePortfolio.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 px-4">{t.executedAt}</td>
                    <td className="py-2 px-3">{t.type}</td>
                    <td className="py-2 px-3 font-bold">{t.ticker}</td>
                    <td className="py-2 px-3 text-right">{t.quantity}</td>
                    <td className="py-2 px-3 text-right">
                      {formatCurrency(t.price, t.currency as 'BRL' | 'USD')}
                    </td>
                    <td className="py-2 px-3 text-right">{t.fees.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTx(t.id)}
                        className="text-slate-400 hover:text-rose-500"
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
