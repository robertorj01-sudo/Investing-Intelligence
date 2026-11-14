import React, { useCallback, useEffect, useState } from 'react';
import { Check, CreditCard, Lock, Shield, Users } from 'lucide-react';
import { useAuth, type PlanDefinition } from '../context/AuthContext';
import { formatCurrency, formatTimestampBRT } from '../utils/formatters';

interface PaymentTx {
  id: number;
  planSlug: string;
  billingCycle: string;
  amountBrl: number;
  gateway: string;
  status: string;
  referenceCode: string;
  createdAt: string;
}

interface AdminOverviewData {
  metrics: {
    totalUsers: number;
    paidUsersCount: number;
    mrrBrl: number;
    arrBrl: number;
    conversionRate: number;
    churnRate: number;
    totalAiQueries: number;
  };
  users: {
    id: number;
    email: string;
    displayName: string;
    role: string;
    plan: string;
    billingCycle: string;
    subscriptionStatus: string;
    createdAt: string;
  }[];
  plans: PlanDefinition[];
  payments: PaymentTx[];
  aiLogs: {
    id: number;
    ticker: string;
    queryType: string;
    prompt: string;
    model: string;
    latencyMs: number;
    createdAt: string;
  }[];
  apiHealth: {
    provider: string;
    status: string;
    lastCheckedAt: string;
    lastError?: string;
    latencyMs: number;
  }[];
}

export function SubscriptionAdminView({ initialTab }: { initialTab?: 'plans' | 'admin' }) {
  const { firebaseUser, dbUser, refreshProfile, loginWithGoogle, authFetch } = useAuth();
  const [tab, setTab] = useState<'plans' | 'privacy' | 'admin'>(initialTab || 'plans');
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [gateway, setGateway] = useState<'stripe' | 'mercadopago'>('stripe');
  const [payments, setPayments] = useState<PaymentTx[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminOverviewData | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const loadPlansAndPayments = useCallback(async () => {
    const pRes = await fetch('/api/plans');
    if (pRes.ok) {
      const d = await pRes.json();
      setPlans(d.plans || []);
    }
    if (firebaseUser) {
      const payRes = await authFetch('/api/subscriptions/payments');
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
      }
    }
  }, [firebaseUser, authFetch]);

  const loadAdmin = useCallback(async () => {
    if (!firebaseUser || dbUser?.role !== 'admin') return;
    const res = await authFetch('/api/admin/overview');
    if (res.ok) {
      setAdminData(await res.json());
    }
  }, [firebaseUser, dbUser?.role, authFetch]);

  useEffect(() => {
    loadPlansAndPayments();
  }, [loadPlansAndPayments]);

  useEffect(() => {
    if (tab === 'admin') loadAdmin();
  }, [tab, loadAdmin]);

  const handleCheckout = async (planSlug: string, startTrial = false) => {
    if (!firebaseUser) {
      await loginWithGoogle();
      return;
    }
    setStatusMsg(null);
    const res = await authFetch('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planSlug, billingCycle, gateway, startTrial }),
    });
    const d = await res.json();
    if (res.ok) {
      setStatusMsg(
        startTrial
          ? `Período de teste de 7 dias ativado para o plano ${planSlug.toUpperCase()}.`
          : `Assinatura ${planSlug.toUpperCase()} confirmada via ${gateway === 'stripe' ? 'Stripe' : 'Mercado Pago'} (${d.payment?.referenceCode}).`
      );
      await refreshProfile();
      await loadPlansAndPayments();
    } else {
      setStatusMsg(d.error || 'Falha ao processar assinatura.');
    }
  };

  const handleCancelSubscription = async () => {
    const res = await authFetch('/api/subscriptions/cancel', { method: 'POST' });
    if (res.ok) {
      setStatusMsg('Assinatura cancelada. Sua conta retornou ao plano Gratuito.');
      await refreshProfile();
    }
  };

  const handleUpdatePrivacy = async (lgpdConsent: boolean, mfaEnabled: boolean) => {
    const res = await authFetch('/api/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ lgpdConsent, mfaEnabled }),
    });
    if (res.ok) {
      await refreshProfile();
      setStatusMsg('Preferências de privacidade e segurança atualizadas.');
    }
  };

  const handleAdminPlanPrice = async (slug: string, monthlyPriceBrl: number) => {
    const annualPriceBrl = Number((monthlyPriceBrl * 12 * 0.8).toFixed(2));
    const res = await authFetch(`/api/admin/plans/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify({ monthlyPriceBrl, annualPriceBrl }),
    });
    if (res.ok) {
      await loadAdmin();
      await loadPlansAndPayments();
    }
  };

  const handleAdminUserPlan = async (userId: number, plan: string) => {
    const res = await authFetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ plan, subscriptionStatus: 'active' }),
    });
    if (res.ok) await loadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Assinaturas SaaS, LGPD & Administração
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Planos Free, Pro e Premium com cobrança mensal/anual, controle de acesso e painel executivo administrativo.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('plans')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              tab === 'plans'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Planos & Faturas
          </button>
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              tab === 'privacy'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Segurança & LGPD
          </button>
          {dbUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setTab('admin')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
                tab === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Painel Admin
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300">
          {statusMsg}
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle & Gateway Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Ciclo de Cobrança:
              </span>
              <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Anual (20% desc.)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-300">Gateway:</span>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value as 'stripe' | 'mercadopago')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
              >
                <option value="stripe">Stripe (Cartão / Internacional)</option>
                <option value="mercadopago">Mercado Pago (Pix / Boleto / Cartão BR)</option>
              </select>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isCurrent = dbUser?.plan === p.slug;
              const price =
                billingCycle === 'annual' ? p.annualPriceBrl / 12 : p.monthlyPriceBrl;
              return (
                <div
                  key={p.slug}
                  className={`bg-white dark:bg-[#0F1623] border rounded-xl p-6 flex flex-col justify-between gap-5 ${
                    p.slug === 'pro'
                      ? 'border-emerald-500/60'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.audience}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                        Plano {p.name}
                      </h2>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {price === 0 ? 'R$ 0' : formatCurrency(price, 'BRL')}
                      </span>
                      <span className="text-xs text-slate-500">/mês</span>
                    </div>
                    {billingCycle === 'annual' && p.annualPriceBrl > 0 && (
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        Cobrado anualmente: {formatCurrency(p.annualPriceBrl, 'BRL')}/ano
                      </div>
                    )}

                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                      IA: {p.aiDailyLimit}/dia · Watchlists: {p.watchlistLimit} · Carteiras:{' '}
                      {p.portfolioLimit}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {p.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    {isCurrent ? (
                      <div className="space-y-2">
                        <div className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          Plano Atual ({dbUser?.subscriptionStatus})
                        </div>
                        {p.slug !== 'free' && (
                          <button
                            type="button"
                            onClick={handleCancelSubscription}
                            className="w-full py-1.5 text-xs text-rose-500 hover:underline"
                          >
                            Cancelar assinatura
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckout(p.slug, false)}
                          className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                            p.slug === 'free'
                              ? 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {p.slug === 'free'
                            ? 'Selecionar Plano Gratuito'
                            : `Assinar ${p.name} agora`}
                        </button>
                        {p.slug !== 'free' && (
                          <button
                            type="button"
                            onClick={() => handleCheckout(p.slug, true)}
                            className="w-full py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Testar grátis por 7 dias
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                Histórico de Pagamentos & Faturas
              </div>
              <table className="w-full text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-4 text-left">Referência</th>
                    <th className="py-2 px-3 text-left">Plano / Ciclo</th>
                    <th className="py-2 px-3 text-left">Gateway</th>
                    <th className="py-2 px-3 text-right">Valor</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-4 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {payments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="py-2 px-4">{pay.referenceCode}</td>
                      <td className="py-2 px-3">
                        {pay.planSlug.toUpperCase()} · {pay.billingCycle}
                      </td>
                      <td className="py-2 px-3">{pay.gateway}</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(pay.amountBrl, 'BRL')}
                      </td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                        {pay.status}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {formatTimestampBRT(pay.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'privacy' && (
        <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 max-w-2xl">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-emerald-500" />
            Privacidade (LGPD) & Segurança da Conta
          </div>
          {!dbUser ? (
            <p className="text-xs text-slate-500">
              Faça login para gerenciar seu consentimento LGPD e preferências de autenticação multifator.
            </p>
          ) : (
            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dbUser.lgpdConsent}
                  onChange={(e) => handleUpdatePrivacy(e.target.checked, dbUser.mfaEnabled)}
                  className="mt-0.5 rounded text-emerald-600"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Consentimento de Tratamento de Dados (LGPD — Lei 13.709/2018)
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Autorizo o armazenamento seguro dos meus lançamentos de carteira, watchlists e histórico analítico exclusivamente para operação da plataforma, com isolamento estrito por usuário.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dbUser.mfaEnabled}
                  onChange={(e) => handleUpdatePrivacy(dbUser.lgpdConsent, e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Verificação Adicional / Autenticação Multifator (MFA)
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Exige confirmação reforçada da sessão Google OAuth antes de alterações sensíveis de assinatura ou exportação de dados.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {tab === 'admin' && dbUser?.role === 'admin' && adminData && (
        <div className="space-y-6">
          {/* Executive SaaS KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'MRR (Receita Mensal)', val: formatCurrency(adminData.metrics.mrrBrl, 'BRL') },
              { label: 'ARR (Receita Anual)', val: formatCurrency(adminData.metrics.arrBrl, 'BRL') },
              { label: 'Usuários / Assinantes', val: `${adminData.metrics.totalUsers} / ${adminData.metrics.paidUsersCount}` },
              { label: 'Conversão Free → Pago', val: `${adminData.metrics.conversionRate}%` },
              { label: 'Churn · Consultas IA', val: `${adminData.metrics.churnRate}% · ${adminData.metrics.totalAiQueries}` },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4"
              >
                <div className="text-[11px] text-slate-500">{kpi.label}</div>
                <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {kpi.val}
                </div>
              </div>
            ))}
          </div>

          {/* Plan Pricing Configurator */}
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Configuração Dinâmica de Preços dos Planos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adminData.plans.map((p) => (
                <div
                  key={p.slug}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {p.name} ({p.slug})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Mensal (R$):</span>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={p.monthlyPriceBrl}
                      onBlur={(e) => handleAdminPlanPrice(p.slug, Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    IA: {p.aiDailyLimit}/dia · Anual: {formatCurrency(p.annualPriceBrl, 'BRL')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users & Subscriptions Table */}
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              Gerenciamento de Usuários ({adminData.users.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-4 text-left">E-mail / Nome</th>
                    <th className="py-2 px-3 text-left">Perfil</th>
                    <th className="py-2 px-3 text-left">Plano</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-4 text-right">Alterar Plano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {adminData.users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{u.email}</div>
                        <div className="text-[11px] text-slate-500">{u.displayName}</div>
                      </td>
                      <td className="py-2 px-3 font-mono">{u.role}</td>
                      <td className="py-2 px-3 font-mono uppercase">{u.plan}</td>
                      <td className="py-2 px-3 font-mono">{u.subscriptionStatus}</td>
                      <td className="py-2 px-4 text-right">
                        <select
                          value={u.plan}
                          onChange={(e) => handleAdminUserPlan(u.id, e.target.value)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                        >
                          <option value="free">FREE</option>
                          <option value="pro">PRO</option>
                          <option value="premium">PREMIUM</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Providers Health & AI Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Monitoramento de Fontes de Dados (APIs)
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {adminData.apiHealth.map((h) => (
                  <div key={h.provider} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{h.provider}</div>
                      {h.lastError && <div className="text-[11px] text-rose-500">{h.lastError}</div>}
                    </div>
                    <div className="text-right font-mono">
                      <div className={h.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>
                        {h.status.toUpperCase()} ({h.latencyMs}ms)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Log Recente de Uso do Analista de IA
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-56 overflow-y-auto">
                {adminData.aiLogs.map((l) => (
                  <div key={l.id} className="py-2 space-y-0.5">
                    <div className="flex justify-between font-mono text-[11px] text-slate-500">
                      <span>{l.ticker || 'GERAL'} · {l.queryType}</span>
                      <span>{l.latencyMs}ms</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 truncate">{l.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
