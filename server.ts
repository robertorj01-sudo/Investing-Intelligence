import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  addPortfolioTransaction,
  adminUpdatePlan,
  adminUpdateUser,
  cancelUserSubscription,
  createPortfolio,
  createWatchlist,
  deletePortfolioTransaction,
  deleteWatchlistItem,
  ensureDefaultPlans,
  getAdminOverview,
  getUserPayments,
  getUserPortfolios,
  getUserScreeners,
  getUserWatchlists,
  logAiAnalysis,
  saveUserScreener,
  subscribeUserToPlan,
  updateUserPrivacySettings,
  upsertWatchlistItem,
} from './src/db/repository.ts';
import { optionalAuth, requireAdmin, requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { generateAnalystChatResponse, generateStructuredStockReport } from './src/server/aiAnalyst.ts';
import {
  getAllEquitiesOverview,
  getEquityDetail,
  getMarketIndices,
  getProvidersHealth,
  getUsdBrlRate,
} from './src/server/marketProvider.ts';
import { CURATED_NEWS, ECONOMIC_CALENDAR } from './src/server/marketUniverse.ts';
import { generateRankings, RANKING_CATEGORIES, type RankingCategory } from './src/server/rankings.ts';
import { calculatePortfolioAnalytics } from './src/shared/financialEngine.ts';
import type { EquityFullDetail, EquityOverview } from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Security headers & lightweight sliding-window rate limiter
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const rateWindowMap = new Map<string, { count: number; resetAt: number }>();
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'local';
  const now = Date.now();
  const entry = rateWindowMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateWindowMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 180) {
    return res.status(429).json({ error: 'Limite de requisições por minuto excedido. Aguarde instantes.' });
  }
  next();
});

// ================= MARKET & PUBLIC DATA ROUTES =================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/market/dashboard', async (_req, res) => {
  try {
    const [indices, equities, fx] = await Promise.all([
      getMarketIndices(),
      getAllEquitiesOverview(true),
      getUsdBrlRate(),
    ]);

    const sortByGain = (arr: EquityOverview[]) =>
      [...arr].sort((a, b) => b.changePct - a.changePct);
    const sortByLoss = (arr: EquityOverview[]) =>
      [...arr].sort((a, b) => a.changePct - b.changePct);
    const sortByVol = (arr: EquityOverview[]) =>
      [...arr].sort((a, b) => b.volumeMillions - a.volumeMillions);

    const br = equities.filter((e) => e.market === 'B3');
    const us = equities.filter((e) => e.market === 'US');

    res.json({
      updatedAt: new Date().toISOString(),
      usdBrl: fx,
      indices,
      equitiesCount: equities.length,
      highlights: {
        brGainers: sortByGain(br).slice(0, 4),
        brLosers: sortByLoss(br).slice(0, 4),
        brMostActive: sortByVol(br).slice(0, 4),
        usGainers: sortByGain(us).slice(0, 4),
        usLosers: sortByLoss(us).slice(0, 4),
        usMostActive: sortByVol(us).slice(0, 4),
      },
      news: CURATED_NEWS,
      calendar: ECONOMIC_CALENDAR,
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err?.message || 'Erro ao carregar visão geral de mercados.' });
  }
});

app.get('/api/equities', async (_req, res) => {
  try {
    const equities = await getAllEquitiesOverview(true);
    res.json({ equities, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar ações.' });
  }
});

app.get('/api/equities/:ticker', async (req, res) => {
  try {
    const ticker = String(req.params.ticker || '');
    const range = String(req.query.range || '2y');
    const interval = String(req.query.interval || '1d');
    const detail = await getEquityDetail(ticker, range, interval);
    if (!detail) {
      return res.status(404).json({
        error: `Ativo "${ticker.toUpperCase()}" não encontrado na B3 ou mercados americanos.`,
      });
    }
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao consultar detalhes da ação.' });
  }
});

app.get('/api/rankings', async (req, res) => {
  try {
    const market = req.query.market === 'US' ? 'US' : 'B3';
    const category = (String(req.query.category || 'growth') as RankingCategory);
    const equities = await getAllEquitiesOverview(true);
    const validCat = RANKING_CATEGORIES.some((c) => c.id === category) ? category : 'growth';
    const items = generateRankings(equities, market, validCat);
    res.json({
      market,
      category: validCat,
      categories: RANKING_CATEGORIES,
      items,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao gerar rankings.' });
  }
});

app.get('/api/plans', async (_req, res) => {
  try {
    const plans = await ensureDefaultPlans();
    res.json({ plans });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar planos.' });
  }
});

// ================= AUTHENTICATED USER ROUTES =================

app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const plans = await ensureDefaultPlans();
    const user = req.dbUser!;
    const currentPlan = plans.find((p) => p.slug === user.plan) ?? plans[0];
    res.json({ user, currentPlan });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar perfil.' });
  }
});

app.patch('/api/me/privacy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { lgpdConsent, mfaEnabled } = req.body ?? {};
    const updated = await updateUserPrivacySettings(
      req.dbUser!.id,
      Boolean(lgpdConsent),
      Boolean(mfaEnabled)
    );
    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar preferências.' });
  }
});

// Portfolios
app.get('/api/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [{ portfolios, transactions }, equities, fx] = await Promise.all([
      getUserPortfolios(req.dbUser!.id),
      getAllEquitiesOverview(true),
      getUsdBrlRate(),
    ]);

    const eqMap = new Map(equities.map((e) => [e.ticker, e]));
    const enriched = portfolios.map((p) => {
      const pTxs = transactions.filter((t) => t.portfolioId === p.id);
      const analytics = calculatePortfolioAnalytics(pTxs, eqMap, fx.rate);
      return {
        ...p,
        transactions: pTxs,
        analytics,
      };
    });

    res.json({ portfolios: enriched, usdBrl: fx });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar carteiras.' });
  }
});

app.post('/api/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, strategy, baseCurrency } = req.body ?? {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Informe um nome válido para a carteira.' });
    }
    const created = await createPortfolio(
      req.dbUser!.id,
      String(name).trim().slice(0, 60),
      String(strategy || 'Longo Prazo').slice(0, 80),
      baseCurrency === 'USD' ? 'USD' : 'BRL'
    );
    res.status(201).json({ portfolio: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao criar carteira.' });
  }
});

app.post('/api/portfolios/:id/transactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const portfolioId = Number(req.params.id);
    const { ticker, market, type, quantity, price, currency, fees, executedAt, notes } =
      req.body ?? {};

    if (!portfolioId || !ticker || Number(quantity) <= 0 || Number(price) <= 0) {
      return res.status(400).json({ error: 'Dados de lançamento inválidos.' });
    }

    const tx = await addPortfolioTransaction({
      portfolioId,
      userId: req.dbUser!.id,
      ticker: String(ticker).toUpperCase().trim().slice(0, 12),
      market: market === 'US' ? 'US' : 'B3',
      type: type === 'SELL' || type === 'DIVIDEND' ? type : 'BUY',
      quantity: Number(quantity),
      price: Number(price),
      currency: currency === 'USD' ? 'USD' : 'BRL',
      fees: Number(fees || 0),
      executedAt: String(executedAt || new Date().toISOString().slice(0, 10)),
      notes: String(notes || '').slice(0, 240),
    });

    res.status(201).json({ transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar lançamento.' });
  }
});

app.delete('/api/portfolios/transactions/:txId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const txId = Number(req.params.txId);
    const deleted = await deletePortfolioTransaction(req.dbUser!.id, txId);
    if (!deleted) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }
    res.json({ deleted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao excluir lançamento.' });
  }
});

// Watchlists
app.get('/api/watchlists', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [{ watchlists, items }, equities] = await Promise.all([
      getUserWatchlists(req.dbUser!.id),
      getAllEquitiesOverview(true),
    ]);
    const eqMap = new Map(equities.map((e) => [e.ticker, e]));

    const enrichedItems = items.map((item) => {
      const eq = eqMap.get(item.ticker);
      const triggeredAlerts: string[] = [];
      if (eq) {
        if (item.targetPrice && eq.price <= item.targetPrice) {
          triggeredAlerts.push(
            `Preço atingiu alvo (${eq.currency === 'BRL' ? 'R$' : 'US$'} ${item.targetPrice.toFixed(2)})`
          );
        }
        if (item.alertPctChange && Math.abs(eq.changePct) >= item.alertPctChange) {
          triggeredAlerts.push(`Variação diária de ${eq.changePct.toFixed(2)}%`);
        }
        if (item.alertRsiBelow && eq.metricsSummary.rsi14 <= item.alertRsiBelow) {
          triggeredAlerts.push(`RSI sobrevendido (${eq.metricsSummary.rsi14.toFixed(1)})`);
        }
        if (item.alertRsiAbove && eq.metricsSummary.rsi14 >= item.alertRsiAbove) {
          triggeredAlerts.push(`RSI sobrecomprado (${eq.metricsSummary.rsi14.toFixed(1)})`);
        }
      }
      return {
        ...item,
        equity: eq ?? null,
        triggeredAlerts,
      };
    });

    res.json({ watchlists, items: enrichedItems });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar watchlists.' });
  }
});

app.post('/api/watchlists', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body ?? {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Nome da lista inválido.' });
    }
    const wl = await createWatchlist(
      req.dbUser!.id,
      String(name).trim().slice(0, 60),
      String(description || '').slice(0, 140)
    );
    res.status(201).json({ watchlist: wl });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao criar watchlist.' });
  }
});

app.post('/api/watchlists/:id/items', requireAuth, async (req: AuthRequest, res) => {
  try {
    const watchlistId = Number(req.params.id);
    const {
      ticker,
      targetPrice,
      alertPctChange,
      alertRsiBelow,
      alertRsiAbove,
      notifyEarnings,
      notifyDividends,
    } = req.body ?? {};

    if (!watchlistId || !ticker) {
      return res.status(400).json({ error: 'Watchlist e ticker são obrigatórios.' });
    }

    const item = await upsertWatchlistItem({
      watchlistId,
      userId: req.dbUser!.id,
      ticker: String(ticker).toUpperCase().trim().slice(0, 12),
      targetPrice: targetPrice !== null && targetPrice !== undefined && targetPrice !== '' ? Number(targetPrice) : null,
      alertPctChange:
        alertPctChange !== null && alertPctChange !== undefined && alertPctChange !== ''
          ? Number(alertPctChange)
          : null,
      alertRsiBelow:
        alertRsiBelow !== null && alertRsiBelow !== undefined && alertRsiBelow !== ''
          ? Number(alertRsiBelow)
          : null,
      alertRsiAbove:
        alertRsiAbove !== null && alertRsiAbove !== undefined && alertRsiAbove !== ''
          ? Number(alertRsiAbove)
          : null,
      notifyEarnings: notifyEarnings !== false,
      notifyDividends: notifyDividends !== false,
    });

    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar alerta na watchlist.' });
  }
});

app.delete('/api/watchlists/items/:itemId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const deleted = await deleteWatchlistItem(req.dbUser!.id, itemId);
    if (!deleted) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    res.json({ deleted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao remover item.' });
  }
});

// Saved Screeners
app.get('/api/screeners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const screeners = await getUserScreeners(req.dbUser!.id);
    res.json({ screeners });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao buscar filtros salvos.' });
  }
});

app.post('/api/screeners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, filters } = req.body ?? {};
    if (!name || !filters) {
      return res.status(400).json({ error: 'Nome e filtros são obrigatórios.' });
    }
    const created = await saveUserScreener(
      req.dbUser!.id,
      String(name).trim().slice(0, 80),
      filters
    );
    res.status(201).json({ screener: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar filtro.' });
  }
});

// Subscriptions & Billing
app.get('/api/subscriptions/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const payments = await getUserPayments(req.dbUser!.id);
    res.json({ payments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao buscar histórico de faturas.' });
  }
});

app.post('/api/subscriptions/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { planSlug, billingCycle, gateway, startTrial } = req.body ?? {};
    if (!['free', 'pro', 'premium'].includes(String(planSlug))) {
      return res.status(400).json({ error: 'Plano inválido.' });
    }
    const result = await subscribeUserToPlan({
      userId: req.dbUser!.id,
      planSlug: String(planSlug),
      billingCycle: billingCycle === 'annual' ? 'annual' : 'monthly',
      gateway: gateway === 'mercadopago' ? 'mercadopago' : 'stripe',
      startTrial: Boolean(startTrial),
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao processar pagamento.' });
  }
});

app.post('/api/subscriptions/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await cancelUserSubscription(req.dbUser!.id);
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao cancelar assinatura.' });
  }
});

// ================= AI STOCK ANALYST ROUTES =================

app.post('/api/ai/report', optionalAuth, async (req: AuthRequest, res) => {
  const started = Date.now();
  try {
    const { tickers, question } = req.body ?? {};
    const tickerList: string[] = Array.isArray(tickers)
      ? tickers.map((t: unknown) => String(t).toUpperCase().trim()).filter(Boolean).slice(0, 4)
      : ['ITUB4'];

    const detailsRaw = await Promise.all(tickerList.map((t) => getEquityDetail(t)));
    const targetEquities = detailsRaw.filter((d): d is EquityFullDetail => d !== null);

    if (targetEquities.length === 0) {
      return res.status(404).json({ error: 'Nenhum dos tickers informados foi encontrado.' });
    }

    const macroIndices = await getMarketIndices();
    let portfolioSummary: unknown = null;
    if (req.dbUser) {
      const [{ transactions }, equities, fx] = await Promise.all([
        getUserPortfolios(req.dbUser.id),
        getAllEquitiesOverview(false),
        getUsdBrlRate(),
      ]);
      if (transactions.length > 0) {
        portfolioSummary = calculatePortfolioAnalytics(
          transactions,
          new Map(equities.map((e) => [e.ticker, e])),
          fx.rate
        );
      }
    }

    const promptText =
      String(question || '').trim() ||
      `Análise completa institucional de ${targetEquities.map((e) => e.ticker).join(' e ')}`;

    const report = await generateStructuredStockReport({
      question: promptText,
      targetEquities,
      macroIndices,
      portfolioSummary,
    });

    await logAiAnalysis({
      userId: req.dbUser?.id ?? null,
      ticker: targetEquities.map((e) => e.ticker).join(','),
      queryType: 'stock_report',
      prompt: promptText,
      reportSummary: report.sections?.executiveSummary?.slice(0, 280) || '',
      model: 'gemini-4-hydrogen',
      latencyMs: Date.now() - started,
    });

    res.json({ report });
  } catch (err: any) {
    console.error('AI Report error:', err);
    res.status(500).json({
      error:
        err?.message ||
        'Falha ao gerar relatório de IA. Verifique se GEMINI_API_KEY está configurada em Secrets.',
    });
  }
});

app.post('/api/ai/chat', optionalAuth, async (req: AuthRequest, res) => {
  const started = Date.now();
  try {
    const { question } = req.body ?? {};
    if (!question || String(question).trim().length < 4) {
      return res.status(400).json({ error: 'Escreva uma pergunta analítica válida.' });
    }

    const [universeOverview, macroIndices] = await Promise.all([
      getAllEquitiesOverview(false),
      getMarketIndices(),
    ]);

    let portfolioSummary: unknown = null;
    if (req.dbUser) {
      const [{ transactions }, fx] = await Promise.all([
        getUserPortfolios(req.dbUser.id),
        getUsdBrlRate(),
      ]);
      if (transactions.length > 0) {
        portfolioSummary = calculatePortfolioAnalytics(
          transactions,
          new Map(universeOverview.map((e) => [e.ticker, e])),
          fx.rate
        );
      }
    }

    const result = await generateAnalystChatResponse({
      question: String(question).trim(),
      universeOverview,
      macroIndices,
      portfolioSummary,
    });

    await logAiAnalysis({
      userId: req.dbUser?.id ?? null,
      ticker: (result.referencedTickers || []).join(','),
      queryType: 'chat',
      prompt: String(question).trim(),
      reportSummary: result.answer.slice(0, 280),
      model: 'gemini-4-hydrogen',
      latencyMs: Date.now() - started,
    });

    res.json(result);
  } catch (err: any) {
    console.error('AI Chat error:', err);
    res.status(500).json({
      error:
        err?.message ||
        'Erro ao consultar Analista de IA. Verifique a configuração da chave em Settings > Secrets.',
    });
  }
});

// ================= ADMIN PANEL ROUTES =================

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const overview = await getAdminOverview();
    res.json({
      ...overview,
      apiHealth: getProvidersHealth(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar painel administrativo.' });
  }
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role, plan, subscriptionStatus } = req.body ?? {};
    const updated = await adminUpdateUser(targetId, { role, plan, subscriptionStatus });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar usuário.' });
  }
});

app.patch('/api/admin/plans/:slug', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const slug = String(req.params.slug);
    const {
      monthlyPriceBrl,
      annualPriceBrl,
      aiDailyLimit,
      watchlistLimit,
      portfolioLimit,
      active,
    } = req.body ?? {};
    const updated = await adminUpdatePlan(slug, {
      monthlyPriceBrl: monthlyPriceBrl !== undefined ? Number(monthlyPriceBrl) : undefined,
      annualPriceBrl: annualPriceBrl !== undefined ? Number(annualPriceBrl) : undefined,
      aiDailyLimit: aiDailyLimit !== undefined ? Number(aiDailyLimit) : undefined,
      watchlistLimit: watchlistLimit !== undefined ? Number(watchlistLimit) : undefined,
      portfolioLimit: portfolioLimit !== undefined ? Number(portfolioLimit) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
    });
    res.json({ plan: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar plano.' });
  }
});

// ================= VITE / STATIC ENTRYPOINT =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`INVEST INTELLIGENCE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
