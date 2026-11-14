import { db } from './index.ts';
import {
  aiAnalysisLogs,
  auditLogs,
  paymentTransactions,
  portfolios,
  portfolioTransactions,
  savedScreeners,
  subscriptionPlans,
  users,
  watchlistItems,
  watchlists,
} from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';

const BOOTSTRAP_ADMIN_EMAIL = 'robertorj01@gmail.com';

const DEFAULT_PLANS = [
  {
    slug: 'free',
    name: 'Gratuito',
    audience: 'Para quem está começando a analisar ações',
    monthlyPriceBrl: 0,
    annualPriceBrl: 0,
    aiDailyLimit: 3,
    watchlistLimit: 1,
    portfolioLimit: 1,
    features: [
      'Dashboard de mercados B3 e EUA (atraso 15 min / fechamento)',
      'Consulta básica de ações e 8 indicadores principais',
      '1 lista de acompanhamento (Watchlist) com até 10 ativos',
      'Notícias financeiras e calendário econômico básico',
      'Até 3 análises diárias com o Analista de IA',
    ],
    active: true,
  },
  {
    slug: 'pro',
    name: 'Pro',
    audience: 'Para investidores ativos em B3 e NYSE/NASDAQ',
    monthlyPriceBrl: 79.9,
    annualPriceBrl: 767.0,
    aiDailyLimit: 30,
    watchlistLimit: 10,
    portfolioLimit: 5,
    features: [
      'Todos os 21 indicadores fundamentalistas + médias setoriais',
      'Histórico financeiro completo de até 10 anos (anual e trimestral)',
      'Comparador simultâneo de até 5 empresas',
      'Stock Screener completo + salvamento de filtros personalizados',
      'Rankings B3 e EUA + Calculadora de Preço Justo (DCF, Gordon, Múltiplos)',
      'Portfolio Tracker multi-moeda (BRL/USD) com até 5 carteiras',
      'Até 30 análises diárias com o Analista de IA + alertas configuráveis',
    ],
    active: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    audience: 'Para investidores avançados, analistas e gestores',
    monthlyPriceBrl: 169.9,
    annualPriceBrl: 1631.0,
    aiDailyLimit: 250,
    watchlistLimit: 50,
    portfolioLimit: 25,
    features: [
      'Tudo do plano Pro com limites institucionais',
      'Analista de IA avançado com relatórios completos de 10 seções',
      'Auditoria inteligente de concentração e risco da carteira com IA',
      'Rankings proprietários INVEST SCORE ajustados por setor',
      'Análises de sensibilidade DCF avançadas e cenários (otimista/base/pessimista)',
      'Exportação de relatórios analíticos e históricos em CSV/JSON',
      'Alertas ilimitados de preço, RSI, resultados e dividendos',
    ],
    active: true,
  },
];

export async function ensureDefaultPlans() {
  try {
    const existing = await db.select().from(subscriptionPlans);
    if (existing.length === 0) {
      for (const plan of DEFAULT_PLANS) {
        await db
          .insert(subscriptionPlans)
          .values(plan)
          .onConflictDoNothing({ target: subscriptionPlans.slug });
      }
      return await db.select().from(subscriptionPlans);
    }
    return existing;
  } catch (error) {
    console.error('Database query failed in ensureDefaultPlans:', error);
    throw new Error('Falha ao carregar planos de assinatura.', { cause: error });
  }
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const isAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      if (isAdmin && current.role !== 'admin') {
        const updated = await db
          .update(users)
          .set({ role: 'admin', plan: 'premium', updatedAt: new Date() })
          .where(eq(users.id, current.id))
          .returning();
        return updated[0];
      }
      return current;
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0] || 'Investidor',
        role: isAdmin ? 'admin' : 'user',
        plan: isAdmin ? 'premium' : 'free',
        billingCycle: 'monthly',
        subscriptionStatus: 'active',
        lgpdConsent: true,
        lgpdConsentAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email, updatedAt: new Date() },
      })
      .returning();

    const user = inserted[0];

    // Provision starter portfolio and watchlist for immediate onboarding
    const existingPortfolios = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, user.id));
    if (existingPortfolios.length === 0) {
      await db.insert(portfolios).values({
        userId: user.id,
        name: 'Carteira Principal',
        strategy: 'Dividendos & Crescimento Global',
        baseCurrency: 'BRL',
      });
    }

    const existingWatchlists = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, user.id));
    if (existingWatchlists.length === 0) {
      const wl = await db
        .insert(watchlists)
        .values({
          userId: user.id,
          name: 'Radar Principal',
          description: 'Ativos monitorados em B3 e EUA',
        })
        .returning();
      if (wl[0]) {
        await db.insert(watchlistItems).values([
          { watchlistId: wl[0].id, userId: user.id, ticker: 'ITUB4', targetPrice: 38.0 },
          { watchlistId: wl[0].id, userId: user.id, ticker: 'WEGE3', targetPrice: 58.0 },
          { watchlistId: wl[0].id, userId: user.id, ticker: 'NVDA', targetPrice: 145.0 },
        ]);
      }
    }

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'users',
      details: { email, role: user.role },
    });

    return user;
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Falha ao sincronizar conta de usuário.', { cause: error });
  }
}

export async function updateUserPrivacySettings(
  userId: number,
  lgpdConsent: boolean,
  mfaEnabled: boolean
) {
  try {
    const res = await db
      .update(users)
      .set({
        lgpdConsent,
        lgpdConsentAt: lgpdConsent ? new Date() : null,
        mfaEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in updateUserPrivacySettings:', error);
    throw new Error('Falha ao atualizar preferências de privacidade e segurança.', { cause: error });
  }
}

export async function getUserPortfolios(userId: number) {
  try {
    const list = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .orderBy(portfolios.id);
    const txs = await db
      .select()
      .from(portfolioTransactions)
      .where(eq(portfolioTransactions.userId, userId))
      .orderBy(desc(portfolioTransactions.executedAt), desc(portfolioTransactions.id));
    return { portfolios: list, transactions: txs };
  } catch (error) {
    console.error('Database query failed in getUserPortfolios:', error);
    throw new Error('Falha ao carregar carteiras.', { cause: error });
  }
}

export async function createPortfolio(
  userId: number,
  name: string,
  strategy: string,
  baseCurrency: string
) {
  try {
    const res = await db
      .insert(portfolios)
      .values({ userId, name, strategy, baseCurrency })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createPortfolio:', error);
    throw new Error('Falha ao criar carteira.', { cause: error });
  }
}

export async function addPortfolioTransaction(input: {
  portfolioId: number;
  userId: number;
  ticker: string;
  market: string;
  type: string;
  quantity: number;
  price: number;
  currency: string;
  fees: number;
  executedAt: string;
  notes: string;
}) {
  try {
    const owned = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, input.portfolioId), eq(portfolios.userId, input.userId)))
      .limit(1);
    if (owned.length === 0) {
      throw new Error('Carteira não encontrada para este usuário.');
    }
    const res = await db.insert(portfolioTransactions).values(input).returning();
    await db.insert(auditLogs).values({
      userId: input.userId,
      action: 'PORTFOLIO_TX_CREATED',
      resource: 'portfolio_transactions',
      details: { ticker: input.ticker, type: input.type, quantity: input.quantity },
    });
    return res[0];
  } catch (error) {
    console.error('Database query failed in addPortfolioTransaction:', error);
    throw new Error('Falha ao registrar lançamento na carteira.', { cause: error });
  }
}

export async function deletePortfolioTransaction(userId: number, txId: number) {
  try {
    const res = await db
      .delete(portfolioTransactions)
      .where(and(eq(portfolioTransactions.id, txId), eq(portfolioTransactions.userId, userId)))
      .returning();
    return res[0] ?? null;
  } catch (error) {
    console.error('Database query failed in deletePortfolioTransaction:', error);
    throw new Error('Falha ao excluir lançamento.', { cause: error });
  }
}

export async function getUserWatchlists(userId: number) {
  try {
    const lists = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(watchlists.id);
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(desc(watchlistItems.id));
    return { watchlists: lists, items };
  } catch (error) {
    console.error('Database query failed in getUserWatchlists:', error);
    throw new Error('Falha ao carregar listas de acompanhamento.', { cause: error });
  }
}

export async function createWatchlist(userId: number, name: string, description: string) {
  try {
    const res = await db.insert(watchlists).values({ userId, name, description }).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createWatchlist:', error);
    throw new Error('Falha ao criar watchlist.', { cause: error });
  }
}

export async function upsertWatchlistItem(input: {
  watchlistId: number;
  userId: number;
  ticker: string;
  targetPrice: number | null;
  alertPctChange: number | null;
  alertRsiBelow: number | null;
  alertRsiAbove: number | null;
  notifyEarnings: boolean;
  notifyDividends: boolean;
}) {
  try {
    const owned = await db
      .select()
      .from(watchlists)
      .where(and(eq(watchlists.id, input.watchlistId), eq(watchlists.userId, input.userId)))
      .limit(1);
    if (owned.length === 0) {
      throw new Error('Watchlist não encontrada.');
    }

    const existing = await db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, input.watchlistId),
          eq(watchlistItems.userId, input.userId),
          eq(watchlistItems.ticker, input.ticker)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(watchlistItems)
        .set({
          targetPrice: input.targetPrice,
          alertPctChange: input.alertPctChange,
          alertRsiBelow: input.alertRsiBelow,
          alertRsiAbove: input.alertRsiAbove,
          notifyEarnings: input.notifyEarnings,
          notifyDividends: input.notifyDividends,
        })
        .where(eq(watchlistItems.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(watchlistItems).values(input).returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in upsertWatchlistItem:', error);
    throw new Error('Falha ao salvar ativo na watchlist.', { cause: error });
  }
}

export async function deleteWatchlistItem(userId: number, itemId: number) {
  try {
    const res = await db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.id, itemId), eq(watchlistItems.userId, userId)))
      .returning();
    return res[0] ?? null;
  } catch (error) {
    console.error('Database query failed in deleteWatchlistItem:', error);
    throw new Error('Falha ao remover ativo da watchlist.', { cause: error });
  }
}

export async function getUserScreeners(userId: number) {
  try {
    return await db
      .select()
      .from(savedScreeners)
      .where(eq(savedScreeners.userId, userId))
      .orderBy(desc(savedScreeners.id));
  } catch (error) {
    console.error('Database query failed in getUserScreeners:', error);
    throw new Error('Falha ao carregar filtros salvos.', { cause: error });
  }
}

export async function saveUserScreener(
  userId: number,
  name: string,
  filters: Record<string, unknown>
) {
  try {
    const res = await db.insert(savedScreeners).values({ userId, name, filters }).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in saveUserScreener:', error);
    throw new Error('Falha ao salvar filtro.', { cause: error });
  }
}

export async function subscribeUserToPlan(input: {
  userId: number;
  planSlug: string;
  billingCycle: 'monthly' | 'annual';
  gateway: 'stripe' | 'mercadopago';
  startTrial?: boolean;
}) {
  try {
    const plans = await ensureDefaultPlans();
    const plan = plans.find((p) => p.slug === input.planSlug);
    if (!plan) {
      throw new Error('Plano não encontrado.');
    }

    const amountBrl =
      input.planSlug === 'free'
        ? 0
        : input.startTrial
        ? 0
        : input.billingCycle === 'annual'
        ? plan.annualPriceBrl
        : plan.monthlyPriceBrl;

    const status =
      input.planSlug === 'free' ? 'active' : input.startTrial ? 'trialing' : 'active';
    const trialEndsAt = input.startTrial
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null;

    const updated = await db
      .update(users)
      .set({
        plan: input.planSlug,
        billingCycle: input.billingCycle,
        subscriptionStatus: status,
        trialEndsAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId))
      .returning();

    const refCode = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

    const payment = await db
      .insert(paymentTransactions)
      .values({
        userId: input.userId,
        planSlug: input.planSlug,
        billingCycle: input.billingCycle,
        amountBrl,
        gateway: input.gateway,
        status: 'paid',
        referenceCode: refCode,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: input.userId,
      action: 'SUBSCRIPTION_UPDATED',
      resource: 'users',
      details: {
        planSlug: input.planSlug,
        billingCycle: input.billingCycle,
        gateway: input.gateway,
        amountBrl,
      },
    });

    return { user: updated[0], payment: payment[0] };
  } catch (error) {
    console.error('Database query failed in subscribeUserToPlan:', error);
    throw new Error('Falha ao processar assinatura.', { cause: error });
  }
}

export async function cancelUserSubscription(userId: number) {
  try {
    const updated = await db
      .update(users)
      .set({
        plan: 'free',
        subscriptionStatus: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    await db.insert(auditLogs).values({
      userId,
      action: 'SUBSCRIPTION_CANCELED',
      resource: 'users',
      details: {},
    });
    return updated[0];
  } catch (error) {
    console.error('Database query failed in cancelUserSubscription:', error);
    throw new Error('Falha ao cancelar assinatura.', { cause: error });
  }
}

export async function logAiAnalysis(input: {
  userId: number | null;
  ticker: string;
  queryType: string;
  prompt: string;
  reportSummary: string;
  model: string;
  latencyMs: number;
}) {
  try {
    const res = await db.insert(aiAnalysisLogs).values(input).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in logAiAnalysis:', error);
    return null;
  }
}

export async function getUserPayments(userId: number) {
  try {
    return await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserPayments:', error);
    throw new Error('Falha ao carregar histórico de pagamentos.', { cause: error });
  }
}

export async function getAdminOverview() {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const plans = await ensureDefaultPlans();
    const payments = await db
      .select()
      .from(paymentTransactions)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(50);
    const aiLogs = await db
      .select()
      .from(aiAnalysisLogs)
      .orderBy(desc(aiAnalysisLogs.createdAt))
      .limit(50);
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    const planMap = new Map(plans.map((p) => [p.slug, p]));
    let mrrBrl = 0;
    let paidUsersCount = 0;
    let canceledCount = 0;

    for (const u of allUsers) {
      if (u.subscriptionStatus === 'canceled') {
        canceledCount++;
      }
      if (u.plan !== 'free' && u.subscriptionStatus === 'active') {
        const p = planMap.get(u.plan);
        if (p) {
          paidUsersCount++;
          mrrBrl += u.billingCycle === 'annual' ? p.annualPriceBrl / 12 : p.monthlyPriceBrl;
        }
      }
    }

    const totalUsers = allUsers.length;
    const conversionRate = totalUsers > 0 ? (paidUsersCount / totalUsers) * 100 : 0;
    const churnRate =
      paidUsersCount + canceledCount > 0
        ? (canceledCount / (paidUsersCount + canceledCount)) * 100
        : 0;

    return {
      metrics: {
        totalUsers,
        paidUsersCount,
        mrrBrl: Number(mrrBrl.toFixed(2)),
        arrBrl: Number((mrrBrl * 12).toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        churnRate: Number(churnRate.toFixed(2)),
        totalAiQueries: aiLogs.length,
      },
      users: allUsers,
      plans,
      payments,
      aiLogs,
      auditLogs: logs,
    };
  } catch (error) {
    console.error('Database query failed in getAdminOverview:', error);
    throw new Error('Falha ao carregar métricas administrativas.', { cause: error });
  }
}

export async function adminUpdateUser(
  targetUserId: number,
  updates: { role?: string; plan?: string; subscriptionStatus?: string }
) {
  try {
    const res = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in adminUpdateUser:', error);
    throw new Error('Falha ao atualizar usuário.', { cause: error });
  }
}

export async function adminUpdatePlan(
  planSlug: string,
  updates: {
    monthlyPriceBrl?: number;
    annualPriceBrl?: number;
    aiDailyLimit?: number;
    watchlistLimit?: number;
    portfolioLimit?: number;
    active?: boolean;
  }
) {
  try {
    const res = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.slug, planSlug))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in adminUpdatePlan:', error);
    throw new Error('Falha ao atualizar plano.', { cause: error });
  }
}
