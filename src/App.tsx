import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  Bot,
  Briefcase,
  Calculator,
  Coins,
  CreditCard,
  GitCompare,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Search,
  Shield,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import type {
  EconomicCalendarEvent,
  EquityOverview,
  MarketIndexQuote,
  NewsItem,
} from './shared/types';
import { AIAnalystView } from './views/AIAnalystView';
import { ComparatorView } from './views/ComparatorView';
import { DashboardView } from './views/DashboardView';
import { DividendsView } from './views/DividendsView';
import { NewsCalendarView } from './views/NewsCalendarView';
import { PortfolioView } from './views/PortfolioView';
import { RankingsView } from './views/RankingsView';
import { ScreenerView } from './views/ScreenerView';
import { StockDetailView } from './views/StockDetailView';
import { SubscriptionAdminView } from './views/SubscriptionAdminView';
import { ValuationView } from './views/ValuationView';
import { WatchlistView } from './views/WatchlistView';

type ModuleId =
  | 'dashboard'
  | 'stock'
  | 'screener'
  | 'rankings'
  | 'ai'
  | 'valuation'
  | 'dividends'
  | 'comparator'
  | 'portfolio'
  | 'watchlist'
  | 'news'
  | 'plans'
  | 'admin';

function InvestIntelligenceShell() {
  const { firebaseUser, dbUser, theme, toggleTheme, loginWithGoogle, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [selectedTicker, setSelectedTicker] = useState<string>('ITUB4');
  const [aiInitialTicker, setAiInitialTicker] = useState<string | undefined>(undefined);
  const [valInitialTicker, setValInitialTicker] = useState<string | undefined>(undefined);
  const [pendingWatchlistTicker, setPendingWatchlistTicker] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Shared Market Data State
  const [indices, setIndices] = useState<MarketIndexQuote[]>([]);
  const [equities, setEquities] = useState<EquityOverview[]>([]);
  const [highlights, setHighlights] = useState<{
    brGainers: EquityOverview[];
    brLosers: EquityOverview[];
    brMostActive: EquityOverview[];
    usGainers: EquityOverview[];
    usLosers: EquityOverview[];
    usMostActive: EquityOverview[];
  } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<EconomicCalendarEvent[]>([]);
  const [usdBrl, setUsdBrl] = useState<{ rate: number; source: string; feedStatus: string } | null>(
    null
  );
  const [updatedAt, setUpdatedAt] = useState('');
  const [loadingMarket, setLoadingMarket] = useState(true);

  const loadMarketData = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const [dashRes, eqRes] = await Promise.all([
        fetch('/api/market/dashboard'),
        fetch('/api/equities'),
      ]);
      if (dashRes.ok) {
        const dash = await dashRes.json();
        setIndices(dash.indices || []);
        setHighlights(dash.highlights || null);
        setNews(dash.news || []);
        setCalendar(dash.calendar || []);
        setUsdBrl(dash.usdBrl || null);
        setUpdatedAt(dash.updatedAt || '');
      }
      if (eqRes.ok) {
        const eq = await eqRes.json();
        setEquities(eq.equities || []);
      }
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  const navigateToStock = useCallback((tk: string) => {
    setSelectedTicker(tk.toUpperCase());
    setActiveModule('stock');
    setMobileNavOpen(false);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = globalSearch.trim().toUpperCase();
    if (!clean) return;
    navigateToStock(clean);
    setGlobalSearch('');
  };

  const navGroups: {
    group: string;
    items: { id: ModuleId; label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      group: 'Mercados & Análise',
      items: [
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'stock', label: 'Análise de Ação', icon: LineChart },
        { id: 'screener', label: 'Stock Screener', icon: SlidersHorizontal },
        { id: 'rankings', label: 'Rankings & Score', icon: Award },
        { id: 'comparator', label: 'Comparador', icon: GitCompare },
      ],
    },
    {
      group: 'Inteligência & Valuation',
      items: [
        { id: 'ai', label: 'Analista de IA', icon: Bot },
        { id: 'valuation', label: 'Preço Justo (DCF)', icon: Calculator },
        { id: 'dividends', label: 'Dividendos & Renda', icon: Coins },
        { id: 'news', label: 'Notícias & Agenda', icon: Newspaper },
      ],
    },
    {
      group: 'Minha Conta',
      items: [
        { id: 'portfolio', label: 'Minha Carteira', icon: Briefcase },
        { id: 'watchlist', label: 'Watchlist & Alertas', icon: Bell },
        { id: 'plans', label: 'Planos & Assinatura', icon: CreditCard },
        ...(dbUser?.role === 'admin'
          ? [{ id: 'admin' as ModuleId, label: 'Painel Admin', icon: Shield }]
          : []),
      ],
    },
  ];

  const activeTitle =
    navGroups.flatMap((g) => g.items).find((i) => i.id === activeModule)?.label ||
    'Visão Geral';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0C121E]">
        <div className="h-16 px-5 flex items-center border-b border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className="text-left whitespace-nowrap shrink-0"
          >
            <span className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              INVEST <span className="text-emerald-600 dark:text-emerald-400">INTELLIGENCE</span>
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
          {firebaseUser && dbUser ? (
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white truncate">
                {dbUser.displayName || dbUser.email}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Plano {dbUser.plan.toUpperCase()} · {dbUser.role === 'admin' ? 'Admin' : 'Investidor'}
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-rose-500"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold hover:opacity-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar com Google
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-full bg-white dark:bg-[#0C121E] border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                INVEST <span className="text-emerald-500">INTELLIGENCE</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 text-slate-500"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-5">
              {navGroups.map((grp) => (
                <div key={grp.group} className="space-y-1">
                  <div className="px-3 text-[11px] font-semibold text-slate-400">{grp.group}</div>
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveModule(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-lg ${
                          activeModule === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Abrir navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              INVEST INTELLIGENCE <span aria-hidden="true">/</span>{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{activeTitle}</span>
            </div>
          </div>

          <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center w-80 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar ação (ITUB4, PETR4, NVDA, AAPL)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F1623] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema claro/escuro"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!firebaseUser ? (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap shrink-0"
              >
                Entrar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModule('plans')}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {dbUser?.plan?.toUpperCase() || 'FREE'}
              </button>
            )}
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeModule === 'dashboard' && (
            <DashboardView
              indices={indices}
              highlights={highlights}
              news={news}
              calendar={calendar}
              usdBrl={usdBrl}
              updatedAt={updatedAt}
              loading={loadingMarket}
              onRefresh={loadMarketData}
              onSelectTicker={navigateToStock}
              onNavigateModule={(t) => setActiveModule(t as ModuleId)}
            />
          )}

          {activeModule === 'stock' && (
            <StockDetailView
              ticker={selectedTicker}
              allEquities={equities}
              onSelectTicker={navigateToStock}
              onOpenAIReport={(tk) => {
                setAiInitialTicker(tk);
                setActiveModule('ai');
              }}
              onOpenValuation={(tk) => {
                setValInitialTicker(tk);
                setActiveModule('valuation');
              }}
              onAddToWatchlist={(tk) => {
                setPendingWatchlistTicker(tk);
                setActiveModule('watchlist');
              }}
            />
          )}

          {activeModule === 'screener' && (
            <ScreenerView
              equities={equities}
              onSelectTicker={navigateToStock}
              onAddToWatchlist={(tk) => {
                setPendingWatchlistTicker(tk);
                setActiveModule('watchlist');
              }}
            />
          )}

          {activeModule === 'rankings' && <RankingsView onSelectTicker={navigateToStock} />}

          {activeModule === 'ai' && (
            <AIAnalystView
              equities={equities}
              initialTicker={aiInitialTicker}
              onSelectTicker={navigateToStock}
            />
          )}

          {activeModule === 'valuation' && (
            <ValuationView equities={equities} initialTicker={valInitialTicker} />
          )}

          {activeModule === 'dividends' && (
            <DividendsView equities={equities} onSelectTicker={navigateToStock} />
          )}

          {activeModule === 'comparator' && (
            <ComparatorView equities={equities} onSelectTicker={navigateToStock} />
          )}

          {activeModule === 'portfolio' && (
            <PortfolioView equities={equities} onSelectTicker={navigateToStock} />
          )}

          {activeModule === 'watchlist' && (
            <WatchlistView
              equities={equities}
              pendingAddTicker={pendingWatchlistTicker}
              onClearPendingAdd={() => setPendingWatchlistTicker(null)}
              onSelectTicker={navigateToStock}
            />
          )}

          {activeModule === 'news' && (
            <NewsCalendarView
              news={news}
              calendar={calendar}
              onSelectTicker={navigateToStock}
            />
          )}

          {(activeModule === 'plans' || activeModule === 'admin') && (
            <SubscriptionAdminView
              initialTab={activeModule === 'admin' ? 'admin' : 'plans'}
            />
          )}
        </main>

        {/* Quiet Regulatory Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            INVEST INTELLIGENCE · Plataforma informativa e analítica para B3, NYSE e NASDAQ. Não executa ordens nem substitui recomendação individualizada (CVM/SEC).
          </span>
          <span>Dados macro: BCB SGS · Cotações: Yahoo Finance / Referência Auditada</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InvestIntelligenceShell />
    </AuthProvider>
  );
}
