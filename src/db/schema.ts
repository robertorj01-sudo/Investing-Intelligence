import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default('').notNull(),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  plan: text('plan').default('free').notNull(), // 'free' | 'pro' | 'premium'
  billingCycle: text('billing_cycle').default('monthly').notNull(), // 'monthly' | 'annual'
  subscriptionStatus: text('subscription_status').default('active').notNull(), // 'active' | 'trialing' | 'past_due' | 'canceled'
  trialEndsAt: timestamp('trial_ends_at'),
  lgpdConsent: boolean('lgpd_consent').default(false).notNull(),
  lgpdConsentAt: timestamp('lgpd_consent_at'),
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'free' | 'pro' | 'premium'
  name: text('name').notNull(),
  audience: text('audience').notNull(),
  monthlyPriceBrl: doublePrecision('monthly_price_brl').notNull(),
  annualPriceBrl: doublePrecision('annual_price_brl').notNull(),
  aiDailyLimit: integer('ai_daily_limit').notNull(),
  watchlistLimit: integer('watchlist_limit').notNull(),
  portfolioLimit: integer('portfolio_limit').notNull(),
  features: jsonb('features').$type<string[]>().notNull(),
  active: boolean('active').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  planSlug: text('plan_slug').notNull(),
  billingCycle: text('billing_cycle').notNull(),
  amountBrl: doublePrecision('amount_brl').notNull(),
  gateway: text('gateway').notNull(), // 'stripe' | 'mercadopago'
  status: text('status').notNull(), // 'paid' | 'pending' | 'failed' | 'refunded'
  referenceCode: text('reference_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  strategy: text('strategy').default('Longo Prazo').notNull(),
  baseCurrency: text('base_currency').default('BRL').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const portfolioTransactions = pgTable('portfolio_transactions', {
  id: serial('id').primaryKey(),
  portfolioId: integer('portfolio_id')
    .references(() => portfolios.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ticker: text('ticker').notNull(),
  market: text('market').notNull(), // 'B3' | 'US'
  type: text('type').notNull(), // 'BUY' | 'SELL' | 'DIVIDEND'
  quantity: doublePrecision('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  currency: text('currency').notNull(), // 'BRL' | 'USD'
  fees: doublePrecision('fees').default(0).notNull(),
  executedAt: text('executed_at').notNull(), // YYYY-MM-DD
  notes: text('notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const watchlistItems = pgTable('watchlist_items', {
  id: serial('id').primaryKey(),
  watchlistId: integer('watchlist_id')
    .references(() => watchlists.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ticker: text('ticker').notNull(),
  targetPrice: doublePrecision('target_price'),
  alertPctChange: doublePrecision('alert_pct_change'),
  alertRsiBelow: doublePrecision('alert_rsi_below'),
  alertRsiAbove: doublePrecision('alert_rsi_above'),
  notifyEarnings: boolean('notify_earnings').default(true).notNull(),
  notifyDividends: boolean('notify_dividends').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedScreeners = pgTable('saved_screeners', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  filters: jsonb('filters').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiAnalysisLogs = pgTable('ai_analysis_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ticker: text('ticker').default('').notNull(),
  queryType: text('query_type').notNull(), // 'stock_report' | 'chat' | 'news_summary' | 'portfolio_audit'
  prompt: text('prompt').notNull(),
  reportSummary: text('report_summary').default('').notNull(),
  model: text('model').default('gemini-4-hydrogen').notNull(),
  latencyMs: integer('latency_ms').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  watchlists: many(watchlists),
  payments: many(paymentTransactions),
  savedScreeners: many(savedScreeners),
  aiLogs: many(aiAnalysisLogs),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  owner: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  transactions: many(portfolioTransactions),
}));

export const portfolioTransactionsRelations = relations(portfolioTransactions, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioTransactions.portfolioId],
    references: [portfolios.id],
  }),
  owner: one(users, {
    fields: [portfolioTransactions.userId],
    references: [users.id],
  }),
}));

export const watchlistsRelations = relations(watchlists, ({ one, many }) => ({
  owner: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
  items: many(watchlistItems),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  watchlist: one(watchlists, {
    fields: [watchlistItems.watchlistId],
    references: [watchlists.id],
  }),
}));
