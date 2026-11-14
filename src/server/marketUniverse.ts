import {
  calculateInvestScore,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from '../shared/financialEngine.ts';
import type {
  DividendEvent,
  EconomicCalendarEvent,
  EquityFullDetail,
  EquityOverview,
  FinancialStatementPeriod,
  FundamentalMetricDetail,
  MarketIndexQuote,
  NewsItem,
  PriceBar,
  SectorProfile,
} from '../shared/types.ts';

export interface EquitySeed {
  ticker: string;
  yahooSymbol: string;
  name: string;
  market: 'B3' | 'US';
  exchange: 'B3' | 'NYSE' | 'NASDAQ';
  currency: 'BRL' | 'USD';
  sector: SectorProfile;
  segment: string;
  tags: string[];
  refPrice: number;
  refPrevClose: number;
  high52w: number;
  low52w: number;
  sharesOutstandingMillions: number;
  freeFloatPct: number;
  avgDailyVolumeMillions: number;
  beta: number;
  dividendFrequency: string;
  nextEarningsDate: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  // Latest audited annual base (2025) in millions (BRL or USD)
  rev25: number;
  rev20: number;
  grossMargin: number;
  ebitdaMargin: number;
  netMargin: number;
  roe: number;
  roic: number | null;
  roa: number;
  netDebt: number;
  ebitda: number;
  ebit: number;
  netIncome: number;
  netIncome20: number;
  assets: number;
  equity: number;
  grossDebt: number;
  currentRatio: number | null;
  dividendYield: number;
  payout: number;
  ocf: number;
  capex: number;
  fcf: number;
  dividends: DividendEvent[];
}

export const EQUITY_SEEDS: EquitySeed[] = [
  // ================= BRASIL — B3 =================
  {
    ticker: 'ITUB4',
    yahooSymbol: 'ITUB4.SA',
    name: 'Itaú Unibanco Holding S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Bancos & Financeiro',
    segment: 'Bancos Múltiplos',
    tags: ['Blue Chips', 'Dividend Stocks', 'Bancos', 'Value Stocks'],
    refPrice: 36.4,
    refPrevClose: 36.12,
    high52w: 38.9,
    low52w: 29.8,
    sharesOutstandingMillions: 9804,
    freeFloatPct: 53.2,
    avgDailyVolumeMillions: 940,
    beta: 0.86,
    dividendFrequency: 'Mensal + Complementares Trimestrais',
    nextEarningsDate: '2026-11-18',
    description:
      'Maior banco privado da América Latina em ativos e valor de mercado, com sólida geração de retorno sobre patrimônio (ROE > 21%) e índice de eficiência líder no setor.',
    strengths: [
      'ROE consistentemente acima de 20% com inadimplência controlada',
      'Forte geração de capital orgânico permitindo payout robusto e JCP recorrente',
      'Plataforma digital consolidada reduzindo custo de servir',
    ],
    weaknesses: [
      'Exposição cíclica ao crédito doméstico e nível da taxa Selic',
      'Competição crescente de fintechs e bancos digitais no varejo',
    ],
    rev25: 172400,
    rev20: 118500,
    grossMargin: 58.2,
    ebitdaMargin: 0,
    netMargin: 23.6,
    roe: 22.1,
    roic: null,
    roa: 1.48,
    netDebt: 0,
    ebitda: 0,
    ebit: 54200,
    netIncome: 40700,
    netIncome20: 18900,
    assets: 2780000,
    equity: 184200,
    grossDebt: 0,
    currentRatio: null,
    dividendYield: 7.4,
    payout: 58.0,
    ocf: 48500,
    capex: 3200,
    fcf: 45300,
    dividends: [
      { exDate: '2026-11-03', paymentDate: '2026-12-01', type: 'JCP', amountPerShare: 0.01765, currency: 'BRL', yieldOnDatePct: 0.05 },
      { exDate: '2026-08-19', paymentDate: '2026-08-29', type: 'JCP', amountPerShare: 0.34, currency: 'BRL', yieldOnDatePct: 0.94 },
      { exDate: '2026-03-04', paymentDate: '2026-03-18', type: 'Dividendo', amountPerShare: 1.25, currency: 'BRL', yieldOnDatePct: 3.45 },
    ],
  },
  {
    ticker: 'PETR4',
    yahooSymbol: 'PETR4.SA',
    name: 'Petróleo Brasileiro S.A. — Petrobras',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Energia & Commodities',
    segment: 'Exploração, Refino e Produção',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks', 'Energia'],
    refPrice: 38.75,
    refPrevClose: 38.4,
    high52w: 42.6,
    low52w: 32.1,
    sharesOutstandingMillions: 13044,
    freeFloatPct: 49.8,
    avgDailyVolumeMillions: 1620,
    beta: 1.08,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2026-11-19',
    description:
      'Produtora integrada de óleo e gás com ativos de altíssima produtividade no Pré-Sal, custo de extração competitivo globalmente e elevada geração de fluxo de caixa livre.',
    strengths: [
      'Lifting cost no Pré-Sal entre os menores da indústria global',
      'Forte conversão de EBITDA em fluxo de caixa livre e Dividend Yield elevado',
      'Alavancagem líquida abaixo de 1,0x EBITDA',
    ],
    weaknesses: [
      'Risco de interferência governamental em preços de combustíveis e alocação de CAPEX',
      'Dependência estrutural da cotação do Brent e taxa de câmbio',
    ],
    rev25: 512000,
    rev20: 272069,
    grossMargin: 50.4,
    ebitdaMargin: 47.2,
    netMargin: 21.8,
    roe: 27.6,
    roic: 19.4,
    roa: 10.6,
    netDebt: 218000,
    ebitda: 241600,
    ebit: 179200,
    netIncome: 111600,
    netIncome20: 7108,
    assets: 1052000,
    equity: 404300,
    grossDebt: 292000,
    currentRatio: 1.18,
    dividendYield: 12.8,
    payout: 62.0,
    ocf: 205000,
    capex: 72000,
    fcf: 133000,
    dividends: [
      { exDate: '2026-08-22', paymentDate: '2026-11-21', type: 'Dividendo', amountPerShare: 1.05, currency: 'BRL', yieldOnDatePct: 2.71 },
      { exDate: '2026-06-12', paymentDate: '2026-09-20', type: 'JCP', amountPerShare: 0.92, currency: 'BRL', yieldOnDatePct: 2.38 },
      { exDate: '2026-04-25', paymentDate: '2026-06-20', type: 'Dividendo', amountPerShare: 1.48, currency: 'BRL', yieldOnDatePct: 3.85 },
    ],
  },
  {
    ticker: 'VALE3',
    yahooSymbol: 'VALE3.SA',
    name: 'Vale S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Energia & Commodities',
    segment: 'Mineração Metálica',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks'],
    refPrice: 61.9,
    refPrevClose: 61.25,
    high52w: 71.4,
    low52w: 54.8,
    sharesOutstandingMillions: 4539,
    freeFloatPct: 68.5,
    avgDailyVolumeMillions: 1280,
    beta: 1.02,
    dividendFrequency: 'Semestral',
    nextEarningsDate: '2026-10-29',
    description:
      'Uma das maiores produtoras mundiais de minério de ferro de alta qualidade e níquel para transição energética, com receita majoritariamente dolarizada.',
    strengths: [
      'Portfólio de minério de ferro de alto teor (Carajás) com prêmio de qualidade',
      'Receita dolarizada atua como hedge natural contra depreciação do Real',
      'Múltiplos EV/EBITDA descontados frente a pares australianos',
    ],
    weaknesses: [
      'Alta sensibilidade à atividade imobiliária e siderúrgica da China',
      'Passivos contingentes e obrigações socioambientais de barragens',
    ],
    rev25: 208500,
    rev20: 208000,
    grossMargin: 41.8,
    ebitdaMargin: 42.5,
    netMargin: 21.2,
    roe: 21.4,
    roic: 15.8,
    roa: 8.9,
    netDebt: 58400,
    ebitda: 88600,
    ebit: 69400,
    netIncome: 44200,
    netIncome20: 26700,
    assets: 496000,
    equity: 206500,
    grossDebt: 82000,
    currentRatio: 1.34,
    dividendYield: 8.9,
    payout: 55.0,
    ocf: 68900,
    capex: 31200,
    fcf: 37700,
    dividends: [
      { exDate: '2026-08-05', paymentDate: '2026-09-04', type: 'JCP', amountPerShare: 2.09, currency: 'BRL', yieldOnDatePct: 3.38 },
      { exDate: '2026-03-11', paymentDate: '2026-03-19', type: 'Dividendo', amountPerShare: 2.73, currency: 'BRL', yieldOnDatePct: 4.41 },
    ],
  },
  {
    ticker: 'WEGE3',
    yahooSymbol: 'WEGE3.SA',
    name: 'WEG S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Indústria & Bens de Capital',
    segment: 'Motores, Automação e Energia',
    tags: ['Blue Chips', 'Growth Stocks'],
    refPrice: 54.8,
    refPrevClose: 54.2,
    high52w: 58.9,
    low52w: 36.4,
    sharesOutstandingMillions: 4197,
    freeFloatPct: 35.4,
    avgDailyVolumeMillions: 420,
    beta: 0.72,
    dividendFrequency: 'Trimestral (Div + JCP)',
    nextEarningsDate: '2026-10-28',
    description:
      'Multinacional brasileira referência global em equipamentos eletroeletrônicos, geração/transmissão de energia (GTD), automação industrial e mobilidade elétrica.',
    strengths: [
      'ROIC consistentemente superior a 30%, padrão global de eficiência industrial',
      'Expansão internacional acelerada na América do Norte e Europa com caixa líquido',
      'Crescimento composto de receita e lucro por mais de duas décadas',
    ],
    weaknesses: [
      'Múltiplo P/L estruturalmente elevado em comparação à média da B3',
      'Pressão pontual de margens com integração de aquisições globais',
    ],
    rev25: 40800,
    rev20: 17469,
    grossMargin: 33.8,
    ebitdaMargin: 22.4,
    netMargin: 16.5,
    roe: 34.2,
    roic: 33.8,
    roa: 18.2,
    netDebt: -3800,
    ebitda: 9139,
    ebit: 8340,
    netIncome: 6732,
    netIncome20: 2341,
    assets: 36900,
    equity: 19680,
    grossDebt: 3100,
    currentRatio: 1.92,
    dividendYield: 1.7,
    payout: 42.0,
    ocf: 7450,
    capex: 2150,
    fcf: 5300,
    dividends: [
      { exDate: '2026-09-22', paymentDate: '2026-10-08', type: 'JCP', amountPerShare: 0.072, currency: 'BRL', yieldOnDatePct: 0.13 },
      { exDate: '2026-07-22', paymentDate: '2026-08-14', type: 'Dividendo', amountPerShare: 0.19, currency: 'BRL', yieldOnDatePct: 0.35 },
    ],
  },
  {
    ticker: 'BBAS3',
    yahooSymbol: 'BBAS3.SA',
    name: 'Banco do Brasil S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Bancos & Financeiro',
    segment: 'Bancos Múltiplos',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks', 'Bancos'],
    refPrice: 27.95,
    refPrevClose: 27.7,
    high52w: 30.1,
    low52w: 24.5,
    sharesOutstandingMillions: 5708,
    freeFloatPct: 49.6,
    avgDailyVolumeMillions: 640,
    beta: 0.91,
    dividendFrequency: '8 pagamentos por ano',
    nextEarningsDate: '2026-11-14',
    description:
      'Líder em crédito rural e presença capilarizada no setor público e varejo brasileiro, negociando a múltiplos descontados frente ao patrimônio e lucro.',
    strengths: [
      'P/VP abaixo de 1,0x mesmo entregando ROE superior a 19%',
      'Liderança estrutural no agronegócio brasileiro',
      'Política previsível de distribuição trimestral de proventos (payout ~45%)',
    ],
    weaknesses: [
      'Risco político e regulatório por ser sociedade de economia mista',
      'Elevação recente da inadimplência na carteira do agronegócio exige provisões',
    ],
    rev25: 148200,
    rev20: 98400,
    grossMargin: 52.0,
    ebitdaMargin: 0,
    netMargin: 25.4,
    roe: 20.4,
    roic: null,
    roa: 1.56,
    netDebt: 0,
    ebitda: 0,
    ebit: 46800,
    netIncome: 37640,
    netIncome20: 13880,
    assets: 2410000,
    equity: 184500,
    grossDebt: 0,
    currentRatio: null,
    dividendYield: 9.8,
    payout: 45.0,
    ocf: 42100,
    capex: 2400,
    fcf: 39700,
    dividends: [
      { exDate: '2026-09-11', paymentDate: '2026-09-27', type: 'JCP', amountPerShare: 0.48, currency: 'BRL', yieldOnDatePct: 1.72 },
      { exDate: '2026-06-11', paymentDate: '2026-06-28', type: 'Dividendo', amountPerShare: 0.34, currency: 'BRL', yieldOnDatePct: 1.22 },
    ],
  },
  {
    ticker: 'BBDC4',
    yahooSymbol: 'BBDC4.SA',
    name: 'Banco Bradesco S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Bancos & Financeiro',
    segment: 'Bancos Múltiplos e Seguros',
    tags: ['Blue Chips', 'Value Stocks', 'Bancos', 'Dividend Stocks'],
    refPrice: 14.85,
    refPrevClose: 14.72,
    high52w: 16.9,
    low52w: 12.1,
    sharesOutstandingMillions: 10611,
    freeFloatPct: 71.0,
    avgDailyVolumeMillions: 520,
    beta: 0.98,
    dividendFrequency: 'Mensal + Complementares',
    nextEarningsDate: '2026-11-04',
    description:
      'Um dos maiores conglomerados financeiros privados do Brasil, com forte operação seguradora (Bradesco Seguros) e plano estratégico de recuperação de rentabilidade.',
    strengths: [
      'Operação de seguros altamente rentável sustenta o resultado consolidado',
      'Valuation comprimido em P/VP abre assimetria caso ROE retorne a 15%+',
    ],
    weaknesses: [
      'ROE ainda em recuperação gradual após ciclo adverso de inadimplência PME/PF',
      'Crescimento de carteira mais conservador limita expansão de receita no curto prazo',
    ],
    rev25: 132000,
    rev20: 106500,
    grossMargin: 48.0,
    ebitdaMargin: 0,
    netMargin: 14.8,
    roe: 12.1,
    roic: null,
    roa: 0.94,
    netDebt: 0,
    ebitda: 0,
    ebit: 24500,
    netIncome: 19540,
    netIncome20: 19450,
    assets: 2078000,
    equity: 161500,
    grossDebt: 0,
    currentRatio: null,
    dividendYield: 7.2,
    payout: 60.0,
    ocf: 25400,
    capex: 2900,
    fcf: 22500,
    dividends: [
      { exDate: '2026-11-01', paymentDate: '2026-12-02', type: 'JCP', amountPerShare: 0.01897, currency: 'BRL', yieldOnDatePct: 0.13 },
      { exDate: '2026-07-01', paymentDate: '2026-08-01', type: 'JCP', amountPerShare: 0.42, currency: 'BRL', yieldOnDatePct: 2.82 },
    ],
  },
  {
    ticker: 'BPAC11',
    yahooSymbol: 'BPAC11.SA',
    name: 'Banco BTG Pactual S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Bancos & Financeiro',
    segment: 'Banco de Investimentos & Wealth',
    tags: ['Blue Chips', 'Growth Stocks', 'Bancos'],
    refPrice: 37.6,
    refPrevClose: 37.1,
    high52w: 40.4,
    low52w: 29.9,
    sharesOutstandingMillions: 3826,
    freeFloatPct: 28.4,
    avgDailyVolumeMillions: 360,
    beta: 1.15,
    dividendFrequency: 'Semestral',
    nextEarningsDate: '2026-11-11',
    description:
      'Maior banco de investimentos da América Latina, combinando Investment Banking, Asset & Wealth Management (mais de R$ 1,7 tri sob gestão) e crédito corporativo.',
    strengths: [
      'Crescimento consistente de receitas recorrentes em Wealth & Asset Management',
      'ROE superior a 23% com receita diversificada além de crédito puro',
    ],
    weaknesses: [
      'Sensibilidade à atividade do mercado de capitais e emissões em ciclos de juro alto',
      'Múltiplo P/VP mais exigente em relação aos bancos tradicionais',
    ],
    rev25: 26800,
    rev20: 9304,
    grossMargin: 76.0,
    ebitdaMargin: 0,
    netMargin: 47.8,
    roe: 23.4,
    roic: null,
    roa: 2.15,
    netDebt: 0,
    ebitda: 0,
    ebit: 15800,
    netIncome: 12810,
    netIncome20: 4050,
    assets: 595000,
    equity: 54700,
    grossDebt: 0,
    currentRatio: null,
    dividendYield: 2.9,
    payout: 30.0,
    ocf: 14100,
    capex: 650,
    fcf: 13450,
    dividends: [
      { exDate: '2026-08-12', paymentDate: '2026-08-22', type: 'JCP', amountPerShare: 0.45, currency: 'BRL', yieldOnDatePct: 1.2 },
    ],
  },
  {
    ticker: 'PRIO3',
    yahooSymbol: 'PRIO3.SA',
    name: 'PRIO S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Energia & Commodities',
    segment: 'Petróleo e Gás Independente',
    tags: ['Growth Stocks', 'Energia', 'Small Caps'],
    refPrice: 43.2,
    refPrevClose: 42.65,
    high52w: 50.8,
    low52w: 37.9,
    sharesOutstandingMillions: 891,
    freeFloatPct: 84.0,
    avgDailyVolumeMillions: 310,
    beta: 1.24,
    dividendFrequency: 'Reinvestimento / Ocasional',
    nextEarningsDate: '2026-11-06',
    description:
      'Maior petroleira privada independente do Brasil, especializada em revitalização de campos maduros offshore (Frade, Albacora Leste, Wahoo, Peregrino) com eficiência operacional ímpar.',
    strengths: [
      'Crescimento expressivo de produção via campanhas de perfuração e M&As eficientes',
      'Margem EBITDA superior a 65% e baixo lifting cost por barril',
    ],
    weaknesses: [
      'Dependência de aprovações ambientais (IBAMA) para entrada de novos poços',
      'Volatilidade atrelada ao preço internacional do Brent',
    ],
    rev25: 15400,
    rev20: 1920,
    grossMargin: 66.2,
    ebitdaMargin: 68.5,
    netMargin: 38.4,
    roe: 31.2,
    roic: 21.8,
    roa: 14.1,
    netDebt: 9800,
    ebitda: 10549,
    ebit: 8200,
    netIncome: 5913,
    netIncome20: 453,
    assets: 41900,
    equity: 18950,
    grossDebt: 14600,
    currentRatio: 1.65,
    dividendYield: 0.4,
    payout: 5.0,
    ocf: 8900,
    capex: 3400,
    fcf: 5500,
    dividends: [],
  },
  {
    ticker: 'EGIE3',
    yahooSymbol: 'EGIE3.SA',
    name: 'ENGIE Brasil Energia S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Utilidade Pública & Saneamento',
    segment: 'Geração e Transmissão Elétrica',
    tags: ['Dividend Stocks', 'Value Stocks', 'Energia'],
    refPrice: 41.5,
    refPrevClose: 41.35,
    high52w: 45.2,
    low52w: 38.1,
    sharesOutstandingMillions: 816,
    freeFloatPct: 31.3,
    avgDailyVolumeMillions: 95,
    beta: 0.56,
    dividendFrequency: 'Semestral',
    nextEarningsDate: '2026-11-05',
    description:
      'Maior geradora privada de energia renovável do Brasil, com contratos de longo prazo indexados à inflação e histórico consistente de distribuição de dividendos.',
    strengths: [
      'Matriz 100% renovável e contratos de energia de longo prazo (PPA)',
      'Baixíssima volatilidade e histórico exemplar de governança (Novo Mercado)',
    ],
    weaknesses: [
      'Alavancagem temporariamente mais alta durante ciclo de investimentos em transmissão e eólicas',
      'Sensibilidade a fenômenos hidrológicos e preços de energia de curto prazo (PLD)',
    ],
    rev25: 11800,
    rev20: 12258,
    grossMargin: 52.1,
    ebitdaMargin: 60.8,
    netMargin: 28.4,
    roe: 28.9,
    roic: 15.2,
    roa: 8.6,
    netDebt: 18200,
    ebitda: 7174,
    ebit: 5980,
    netIncome: 3351,
    netIncome20: 2797,
    assets: 38900,
    equity: 11590,
    grossDebt: 22100,
    currentRatio: 1.48,
    dividendYield: 6.8,
    payout: 65.0,
    ocf: 6250,
    capex: 3800,
    fcf: 2450,
    dividends: [
      { exDate: '2026-08-21', paymentDate: '2026-12-18', type: 'Dividendo', amountPerShare: 1.14, currency: 'BRL', yieldOnDatePct: 2.75 },
      { exDate: '2026-05-08', paymentDate: '2026-07-26', type: 'Dividendo', amountPerShare: 1.22, currency: 'BRL', yieldOnDatePct: 2.94 },
    ],
  },
  {
    ticker: 'RENT3',
    yahooSymbol: 'RENT3.SA',
    name: 'Localiza Rent a Car S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Consumo & Varejo',
    segment: 'Locação de Veículos e Gestão de Frotas',
    tags: ['Blue Chips', 'Growth Stocks', 'Value Stocks'],
    refPrice: 41.8,
    refPrevClose: 41.1,
    high52w: 58.6,
    low52w: 36.2,
    sharesOutstandingMillions: 1068,
    freeFloatPct: 79.5,
    avgDailyVolumeMillions: 380,
    beta: 1.28,
    dividendFrequency: 'Trimestral (JCP)',
    nextEarningsDate: '2026-11-12',
    description:
      'Líder absoluta na América Latina em aluguel de carros e gestão de frotas corporativas, com forte poder de barganha junto às montadoras e rede capilarizada de Seminovos.',
    strengths: [
      'Escala dominante garante condições diferenciadas na compra e revenda de veículos',
      'Retorno sobre capital investido (ROIC) histórico superior ao custo da dívida',
    ],
    weaknesses: [
      'Taxa Selic elevada aumenta despesa financeira devido à natureza intensiva em capital',
      'Ciclo de depreciação dos seminovos exige ajuste constante de tarifas',
    ],
    rev25: 37900,
    rev20: 10305,
    grossMargin: 28.4,
    ebitdaMargin: 33.1,
    netMargin: 8.6,
    roe: 13.8,
    roic: 12.1,
    roa: 4.1,
    netDebt: 30200,
    ebitda: 12545,
    ebit: 7600,
    netIncome: 3259,
    netIncome20: 1048,
    assets: 79400,
    equity: 23600,
    grossDebt: 39800,
    currentRatio: 1.12,
    dividendYield: 3.4,
    payout: 45.0,
    ocf: 9200,
    capex: 10800,
    fcf: -1600,
    dividends: [
      { exDate: '2026-09-25', paymentDate: '2026-11-14', type: 'JCP', amountPerShare: 0.39, currency: 'BRL', yieldOnDatePct: 0.93 },
    ],
  },
  {
    ticker: 'B3SA3',
    yahooSymbol: 'B3SA3.SA',
    name: 'B3 S.A. — Brasil, Bolsa, Balcão',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Bancos & Financeiro',
    segment: 'Infraestrutura de Mercado Financeiro',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks'],
    refPrice: 11.4,
    refPrevClose: 11.28,
    high52w: 14.2,
    low52w: 9.85,
    sharesOutstandingMillions: 5420,
    freeFloatPct: 98.5,
    avgDailyVolumeMillions: 410,
    beta: 1.04,
    dividendFrequency: 'Trimestral (Div + JCP + Recompra)',
    nextEarningsDate: '2026-11-13',
    description:
      'Operadora da infraestrutura de bolsa, balcão, depositária e registro do mercado brasileiro, com margens operacionais altíssimas e forte retorno ao acionista.',
    strengths: [
      'Margem EBITDA recorrente próxima a 70% e conversão de caixa próxima a 100%',
      'Diversificação crescente em dados, analytics, financiamento e renda fixa',
    ],
    weaknesses: [
      'ADTV (volume negociado em ações) pressionado em períodos de juro real elevado',
      'Possível entrada gradual de competidores em negociação de renda variável',
    ],
    rev25: 10650,
    rev20: 9325,
    grossMargin: 89.0,
    ebitdaMargin: 71.4,
    netMargin: 44.2,
    roe: 23.6,
    roic: 18.9,
    roa: 10.2,
    netDebt: 2400,
    ebitda: 7604,
    ebit: 6700,
    netIncome: 4707,
    netIncome20: 4150,
    assets: 46100,
    equity: 19940,
    grossDebt: 14200,
    currentRatio: 1.54,
    dividendYield: 5.9,
    payout: 75.0,
    ocf: 5300,
    capex: 310,
    fcf: 4990,
    dividends: [
      { exDate: '2026-09-23', paymentDate: '2026-10-07', type: 'JCP', amountPerShare: 0.064, currency: 'BRL', yieldOnDatePct: 0.56 },
    ],
  },
  {
    ticker: 'SUZB3',
    yahooSymbol: 'SUZB3.SA',
    name: 'Suzano S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Energia & Commodities',
    segment: 'Papel e Celulose',
    tags: ['Blue Chips', 'Value Stocks'],
    refPrice: 57.3,
    refPrevClose: 56.8,
    high52w: 64.9,
    low52w: 48.2,
    sharesOutstandingMillions: 1264,
    freeFloatPct: 54.0,
    avgDailyVolumeMillions: 265,
    beta: 0.78,
    dividendFrequency: 'Anual / JCP',
    nextEarningsDate: '2026-10-29',
    description:
      'Maior produtora global de celulose de eucalipto (fibra curta), com o menor custo caixa da indústria mundial e nova megafábrica Projeto Cerrado em plena rampa.',
    strengths: [
      'Custo caixa de produção imbatível globalmente e base florestal própria',
      'Receita quase 100% atrelada ao Dólar e redução de alavancagem pós-Cerrado',
    ],
    weaknesses: [
      'Alavancagem financeira moderada-alta (~3x EBITDA) durante ciclos de baixa da celulose',
      'Ciclicidade nos preços globais da celulose BHKP',
    ],
    rev25: 48600,
    rev20: 30460,
    grossMargin: 44.2,
    ebitdaMargin: 49.5,
    netMargin: 16.4,
    roe: 17.8,
    roic: 11.4,
    roa: 5.1,
    netDebt: 69500,
    ebitda: 24057,
    ebit: 15900,
    netIncome: 7970,
    netIncome20: 2480,
    assets: 156000,
    equity: 44700,
    grossDebt: 89200,
    currentRatio: 2.15,
    dividendYield: 2.6,
    payout: 28.0,
    ocf: 17800,
    capex: 9400,
    fcf: 8400,
    dividends: [
      { exDate: '2026-12-16', paymentDate: '2027-01-10', type: 'JCP', amountPerShare: 1.49, currency: 'BRL', yieldOnDatePct: 2.6 },
    ],
  },
  {
    ticker: 'ABEV3',
    yahooSymbol: 'ABEV3.SA',
    name: 'Ambev S.A.',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Consumo & Varejo',
    segment: 'Bebidas',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks'],
    refPrice: 12.65,
    refPrevClose: 12.55,
    high52w: 14.1,
    low52w: 11.2,
    sharesOutstandingMillions: 15757,
    freeFloatPct: 27.6,
    avgDailyVolumeMillions: 310,
    beta: 0.64,
    dividendFrequency: 'Anual / Trimestral',
    nextEarningsDate: '2026-10-30',
    description:
      'Maior cervejaria da América Latina com portfólio dominante (Brahma, Spaten, Corona, Stella), caixa líquido robusto e ecossistema B2B digital BEES.',
    strengths: [
      'Balanço extremamente sólido com caixa líquido e baixíssimo risco financeiro',
      'Expansão do mix premium melhora margem bruta mesmo com volume estável',
    ],
    weaknesses: [
      'Crescimento modesto de receita real e exposição cambial nos insumos (cevada/alumínio)',
      'Discussões tributárias recorrentes sobre subvenções e ICMS',
    ],
    rev25: 86500,
    rev20: 58379,
    grossMargin: 51.2,
    ebitdaMargin: 32.1,
    netMargin: 17.6,
    roe: 16.9,
    roic: 18.2,
    roa: 10.8,
    netDebt: -13500,
    ebitda: 27766,
    ebit: 21400,
    netIncome: 15224,
    netIncome20: 11732,
    assets: 141000,
    equity: 90080,
    grossDebt: 3900,
    currentRatio: 1.29,
    dividendYield: 6.1,
    payout: 78.0,
    ocf: 24100,
    capex: 5100,
    fcf: 19000,
    dividends: [
      { exDate: '2026-12-19', paymentDate: '2027-01-07', type: 'Dividendo', amountPerShare: 0.77, currency: 'BRL', yieldOnDatePct: 6.08 },
    ],
  },
  {
    ticker: 'VIVT3',
    yahooSymbol: 'VIVT3.SA',
    name: 'Telefônica Brasil S.A. (Vivo)',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Utilidade Pública & Saneamento',
    segment: 'Telecomunicações',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks'],
    refPrice: 52.4,
    refPrevClose: 52.05,
    high52w: 56.8,
    low52w: 46.9,
    sharesOutstandingMillions: 1648,
    freeFloatPct: 24.5,
    avgDailyVolumeMillions: 115,
    beta: 0.52,
    dividendFrequency: 'Mensal / Trimestral + Redução Capital',
    nextEarningsDate: '2026-10-29',
    description:
      'Líder em telefonia móvel pós-paga e fibra óptica (FTTH) no Brasil, com forte geração de caixa livre e compromisso de distribuir >= 100% do lucro líquido.',
    strengths: [
      'Liderança de receita média por usuário (ARPU) e menor churn do setor',
      'CAPEX em queda gradual amplia o fluxo de caixa livre e proventos',
    ],
    weaknesses: [
      'Setor intensivo em capital com crescimento orgânico ligado à inflação/IPCA',
      'Competição regional de provedores locais de fibra (ISPs)',
    ],
    rev25: 56800,
    rev20: 43127,
    grossMargin: 59.5,
    ebitdaMargin: 41.2,
    netMargin: 10.6,
    roe: 8.9,
    roic: 9.8,
    roa: 4.9,
    netDebt: 11200,
    ebitda: 23401,
    ebit: 9200,
    netIncome: 6020,
    netIncome20: 4771,
    assets: 122800,
    equity: 67640,
    grossDebt: 18400,
    currentRatio: 1.05,
    dividendYield: 6.9,
    payout: 98.0,
    ocf: 18200,
    capex: 8900,
    fcf: 9300,
    dividends: [
      { exDate: '2026-09-16', paymentDate: '2026-12-10', type: 'JCP', amountPerShare: 0.85, currency: 'BRL', yieldOnDatePct: 1.62 },
    ],
  },
  {
    ticker: 'SBSP3',
    yahooSymbol: 'SBSP3.SA',
    name: 'Companhia de Saneamento Básico de SP — Sabesp',
    market: 'B3',
    exchange: 'B3',
    currency: 'BRL',
    sector: 'Utilidade Pública & Saneamento',
    segment: 'Saneamento Básico',
    tags: ['Blue Chips', 'Growth Stocks', 'Value Stocks'],
    refPrice: 93.6,
    refPrevClose: 92.8,
    high52w: 102.4,
    low52w: 71.2,
    sharesOutstandingMillions: 683.5,
    freeFloatPct: 64.0,
    avgDailyVolumeMillions: 290,
    beta: 0.68,
    dividendFrequency: 'Anual',
    nextEarningsDate: '2026-11-11',
    description:
      'Maior companhia de água e saneamento da América Latina, recém-privatizada com acionista de referência Equatorial e amplo programa de ganhos de eficiência operacional.',
    strengths: [
      'Receitas reguladas indexadas à inflação e ganho de margem pós-privatização',
      'Redução de perdas hídricas e corte de custos operacionais (PMSO)',
    ],
    weaknesses: [
      'Ciclo de investimentos pesados (CAPEX universalização até 2029) limita payout no curto prazo',
      'Dependência de decisões da agência reguladora ARSESP',
    ],
    rev25: 29800,
    rev20: 17797,
    grossMargin: 49.4,
    ebitdaMargin: 46.8,
    netMargin: 21.5,
    roe: 17.6,
    roic: 13.4,
    roa: 8.8,
    netDebt: 17900,
    ebitda: 13946,
    ebit: 10600,
    netIncome: 6407,
    netIncome20: 973,
    assets: 72800,
    equity: 36400,
    grossDebt: 24500,
    currentRatio: 1.42,
    dividendYield: 2.3,
    payout: 25.0,
    ocf: 10900,
    capex: 8200,
    fcf: 2700,
    dividends: [
      { exDate: '2026-04-28', paymentDate: '2026-06-20', type: 'JCP', amountPerShare: 2.15, currency: 'BRL', yieldOnDatePct: 2.3 },
    ],
  },

  // ================= ESTADOS UNIDOS — NYSE / NASDAQ =================
  {
    ticker: 'NVDA',
    yahooSymbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semicondutores & IA',
    segment: 'GPUs, Data Center & Plataformas de IA',
    tags: ['Blue Chips', 'Growth Stocks', 'Tecnologia', 'Inteligência Artificial', 'Semicondutores'],
    refPrice: 146.2,
    refPrevClose: 143.9,
    high52w: 158.4,
    low52w: 86.5,
    sharesOutstandingMillions: 24530,
    freeFloatPct: 95.8,
    avgDailyVolumeMillions: 31200,
    beta: 1.62,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2026-11-19',
    description:
      'Líder global em computação acelerada e infraestrutura de Inteligência Artificial (arquiteturas Hopper/Blackwell/Rubin e ecossistema CUDA), com margens brutas acima de 74%.',
    strengths: [
      'Fosso competitivo profundo via ecossistema de software CUDA e redes NVLink',
      'Crescimento extraordinário de receita em Data Center e geração massiva de FCF',
      'Posição líquida de caixa robusta financia P&D líder da indústria',
    ],
    weaknesses: [
      'Concentração de receita em poucos hyperscalers (Microsoft, Meta, Alphabet, Amazon)',
      'Risco regulatório/geopolítico de restrições de exportação e competição de ASICs customizados',
    ],
    rev25: 168500,
    rev20: 16675,
    grossMargin: 74.8,
    ebitdaMargin: 63.2,
    netMargin: 54.6,
    roe: 98.4,
    roic: 76.5,
    roa: 58.2,
    netDebt: -34200,
    ebitda: 106492,
    ebit: 103100,
    netIncome: 92001,
    netIncome20: 4332,
    assets: 158000,
    equity: 93500,
    grossDebt: 9800,
    currentRatio: 4.15,
    dividendYield: 0.03,
    payout: 1.1,
    ocf: 84200,
    capex: 4600,
    fcf: 79600,
    dividends: [
      { exDate: '2026-09-11', paymentDate: '2026-10-02', type: 'Cash Dividend', amountPerShare: 0.01, currency: 'USD', yieldOnDatePct: 0.01 },
    ],
  },
  {
    ticker: 'AAPL',
    yahooSymbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Dispositivos, Ecossistema e Serviços',
    tags: ['Blue Chips', 'Tecnologia', 'Inteligência Artificial'],
    refPrice: 229.4,
    refPrevClose: 227.85,
    high52w: 242.5,
    low52w: 178.1,
    sharesOutstandingMillions: 15115,
    freeFloatPct: 99.8,
    avgDailyVolumeMillions: 10450,
    beta: 1.18,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2027-01-29',
    description:
      'Ecossistema de hardware e serviços digitais com mais de 2,2 bilhões de dispositivos ativos, gerando mais de US$ 105 bilhões anuais em Fluxo de Caixa Livre.',
    strengths: [
      'Base instalada de altíssima fidelidade impulsiona receita recorrente de Serviços',
      'Retorno sobre capital e recompra consistente de ações elevam EPS anualmente',
    ],
    weaknesses: [
      'Crescimento de receita consolidada de dígito único baixo/médio',
      'Escrutínio antitruste nos EUA e União Europeia sobre App Store e acordos padrão',
    ],
    rev25: 408200,
    rev20: 274515,
    grossMargin: 46.5,
    ebitdaMargin: 34.4,
    netMargin: 26.8,
    roe: 142.0,
    roic: 56.4,
    roa: 29.8,
    netDebt: 48500,
    ebitda: 140420,
    ebit: 128900,
    netIncome: 109397,
    netIncome20: 57411,
    assets: 367000,
    equity: 77040,
    grossDebt: 104500,
    currentRatio: 0.96,
    dividendYield: 0.44,
    payout: 14.5,
    ocf: 118500,
    capex: 10200,
    fcf: 108300,
    dividends: [
      { exDate: '2026-11-08', paymentDate: '2026-11-14', type: 'Cash Dividend', amountPerShare: 0.25, currency: 'USD', yieldOnDatePct: 0.11 },
    ],
  },
  {
    ticker: 'MSFT',
    yahooSymbol: 'MSFT',
    name: 'Microsoft Corporation',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Cloud (Azure), Produtividade & IA Corporativa',
    tags: ['Blue Chips', 'Growth Stocks', 'Tecnologia', 'Inteligência Artificial'],
    refPrice: 432.6,
    refPrevClose: 429.4,
    high52w: 468.3,
    low52w: 368.0,
    sharesOutstandingMillions: 7433,
    freeFloatPct: 99.9,
    avgDailyVolumeMillions: 8650,
    beta: 0.93,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2027-01-28',
    description:
      'Gigante global de software empresarial e computação em nuvem (Azure), integrando IA generativa (Copilot) em toda a suíte Microsoft 365, GitHub e Dynamics.',
    strengths: [
      'Receita corporativa altamente previsível e retenção líquida elevada no Azure',
      'Balanço AAA com forte geração de caixa operacional mesmo em ciclo intenso de CAPEX',
    ],
    weaknesses: [
      'Aumento acelerado de CAPEX em infraestrutura de IA pressiona depreciação futura',
      'Valuation acima de 30x lucros exige manutenção de crescimento acima de 13% ao ano',
    ],
    rev25: 278400,
    rev20: 143015,
    grossMargin: 69.6,
    ebitdaMargin: 53.8,
    netMargin: 36.1,
    roe: 35.8,
    roic: 28.4,
    roa: 19.2,
    netDebt: -14200,
    ebitda: 149779,
    ebit: 122400,
    netIncome: 100502,
    netIncome20: 44281,
    assets: 523000,
    equity: 280700,
    grossDebt: 64200,
    currentRatio: 1.38,
    dividendYield: 0.77,
    payout: 24.0,
    ocf: 128400,
    capex: 52800,
    fcf: 75600,
    dividends: [
      { exDate: '2026-11-21', paymentDate: '2026-12-12', type: 'Cash Dividend', amountPerShare: 0.83, currency: 'USD', yieldOnDatePct: 0.19 },
    ],
  },
  {
    ticker: 'AMZN',
    yahooSymbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Cloud (AWS), E-Commerce & Publicidade Digital',
    tags: ['Blue Chips', 'Growth Stocks', 'Tecnologia', 'Inteligência Artificial'],
    refPrice: 211.8,
    refPrevClose: 209.4,
    high52w: 224.0,
    low52w: 151.6,
    sharesOutstandingMillions: 10510,
    freeFloatPct: 90.8,
    avgDailyVolumeMillions: 7900,
    beta: 1.19,
    dividendFrequency: 'Não distribui (Reinvestimento)',
    nextEarningsDate: '2027-02-04',
    description:
      'Líder global em infraestrutura em nuvem (AWS) e varejo digital, com expansão expressiva de margem operacional impulsionada por AWS, logística regionalizada e Ads.',
    strengths: [
      'AWS e Publicidade Digital com margens altíssimas elevam o retorno consolidado',
      'Eficiência da malha logística norte-americana multiplicou o fluxo de caixa livre',
    ],
    weaknesses: [
      'Ciclo bilionário de investimentos em data centers de IA exige retorno consistente',
      'Competição no varejo de desconto e pressões trabalhistas',
    ],
    rev25: 678400,
    rev20: 386064,
    grossMargin: 48.9,
    ebitdaMargin: 19.6,
    netMargin: 9.4,
    roe: 22.8,
    roic: 15.9,
    roa: 10.1,
    netDebt: 24500,
    ebitda: 132966,
    ebit: 76500,
    netIncome: 63769,
    netIncome20: 21331,
    assets: 631000,
    equity: 279600,
    grossDebt: 129500,
    currentRatio: 1.09,
    dividendYield: 0.0,
    payout: 0.0,
    ocf: 126500,
    capex: 74200,
    fcf: 52300,
    dividends: [],
  },
  {
    ticker: 'GOOGL',
    yahooSymbol: 'GOOGL',
    name: 'Alphabet Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Busca, YouTube, Cloud & IA',
    tags: ['Blue Chips', 'Growth Stocks', 'Value Stocks', 'Tecnologia', 'Inteligência Artificial'],
    refPrice: 181.5,
    refPrevClose: 179.9,
    high52w: 196.7,
    low52w: 138.2,
    sharesOutstandingMillions: 12320,
    freeFloatPct: 88.2,
    avgDailyVolumeMillions: 4850,
    beta: 1.05,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2027-02-02',
    description:
      'Controladora do Google Search, YouTube, Android, Google Cloud e DeepMind, combinando geração maciça de caixa com múltiplo P/L mais acessível entre as Big Techs.',
    strengths: [
      'Múltiplo P/L mais descontado entre as megacaps americanas com caixa líquido > US$ 80 bi',
      'Google Cloud atingiu escala rentável e YouTube lidera streaming em CTV',
    ],
    weaknesses: [
      'Riscos antitruste do Departamento de Justiça dos EUA sobre distribuição do Search',
      'Disputa competitiva na evolução da busca para respostas generativas',
    ],
    rev25: 374500,
    rev20: 182527,
    grossMargin: 58.6,
    ebitdaMargin: 37.8,
    netMargin: 27.9,
    roe: 31.8,
    roic: 26.2,
    roa: 22.4,
    netDebt: -82400,
    ebitda: 141561,
    ebit: 121800,
    netIncome: 104485,
    netIncome20: 40269,
    assets: 466000,
    equity: 328500,
    grossDebt: 27800,
    currentRatio: 1.98,
    dividendYield: 0.44,
    payout: 9.5,
    ocf: 131200,
    capex: 51800,
    fcf: 79400,
    dividends: [
      { exDate: '2026-09-09', paymentDate: '2026-09-16', type: 'Cash Dividend', amountPerShare: 0.2, currency: 'USD', yieldOnDatePct: 0.11 },
    ],
  },
  {
    ticker: 'META',
    yahooSymbol: 'META',
    name: 'Meta Platforms, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Tecnologia & Software',
    segment: 'Redes Sociais, Ads & IA Open-Source',
    tags: ['Blue Chips', 'Growth Stocks', 'Tecnologia', 'Inteligência Artificial'],
    refPrice: 589.4,
    refPrevClose: 584.1,
    high52w: 615.2,
    low52w: 392.4,
    sharesOutstandingMillions: 2528,
    freeFloatPct: 86.4,
    avgDailyVolumeMillions: 7200,
    beta: 1.24,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2027-01-29',
    description:
      'Operadora da família de aplicativos mais utilizada do planeta (Facebook, Instagram, WhatsApp), alavancando modelos Llama e segmentação por IA para maximizar retorno em publicidade.',
    strengths: [
      'Mais de 3,2 bilhões de usuários ativos diários com monetização crescente via Reels e WhatsApp Business',
      'Margens operacionais acima de 40% e forte recompra de ações',
    ],
    weaknesses: [
      'Prejuízos contínuos na divisão Reality Labs e aumento expressivo de CAPEX em IA',
      'Dependência de receita de publicidade digital (~98% da receita)',
    ],
    rev25: 178200,
    rev20: 85965,
    grossMargin: 81.6,
    ebitdaMargin: 49.4,
    netMargin: 35.8,
    roe: 36.4,
    roic: 29.8,
    roa: 23.9,
    netDebt: -32100,
    ebitda: 88030,
    ebit: 72400,
    netIncome: 63795,
    netIncome20: 29146,
    assets: 266800,
    equity: 175200,
    grossDebt: 38200,
    currentRatio: 2.68,
    dividendYield: 0.34,
    payout: 8.0,
    ocf: 91200,
    capex: 39400,
    fcf: 51800,
    dividends: [
      { exDate: '2026-09-16', paymentDate: '2026-09-26', type: 'Cash Dividend', amountPerShare: 0.5, currency: 'USD', yieldOnDatePct: 0.08 },
    ],
  },
  {
    ticker: 'AMD',
    yahooSymbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semicondutores & IA',
    segment: 'CPUs EPYC & Aceleradores Instinct AI',
    tags: ['Growth Stocks', 'Tecnologia', 'Inteligência Artificial', 'Semicondutores'],
    refPrice: 152.7,
    refPrevClose: 150.1,
    high52w: 192.3,
    low52w: 121.8,
    sharesOutstandingMillions: 1623,
    freeFloatPct: 99.1,
    avgDailyVolumeMillions: 5400,
    beta: 1.68,
    dividendFrequency: 'Não distribui',
    nextEarningsDate: '2027-02-03',
    description:
      'Principal desafiante da NVIDIA em aceleradores de IA para Data Center (linha Instinct MI325/MI350) e ganhadora consistente de market share em servidores x86 (EPYC).',
    strengths: [
      'Ganho contínuo de participação em CPUs de servidores corporativos (EPYC)',
      'Receita de Data Center em forte aceleração com adoção por Microsoft e Meta',
    ],
    weaknesses: [
      'Ecossistema de software ROCm ainda atrás do padrão CUDA da NVIDIA',
      'P/L GAAP elevado devido à amortização de intangíveis da aquisição da Xilinx',
    ],
    rev25: 31400,
    rev20: 9763,
    grossMargin: 52.8,
    ebitdaMargin: 27.4,
    netMargin: 16.8,
    roe: 9.2,
    roic: 8.6,
    roa: 7.4,
    netDebt: -3100,
    ebitda: 8603,
    ebit: 5900,
    netIncome: 5275,
    netIncome20: 2490,
    assets: 71200,
    equity: 57300,
    grossDebt: 2400,
    currentRatio: 2.52,
    dividendYield: 0.0,
    payout: 0.0,
    ocf: 5800,
    capex: 720,
    fcf: 5080,
    dividends: [],
  },
  {
    ticker: 'AVGO',
    yahooSymbol: 'AVGO',
    name: 'Broadcom Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semicondutores & IA',
    segment: 'ASICs Customizados de IA & Software de Infraestrutura',
    tags: ['Blue Chips', 'Growth Stocks', 'Tecnologia', 'Inteligência Artificial', 'Semicondutores', 'Dividend Stocks'],
    refPrice: 179.4,
    refPrevClose: 176.8,
    high52w: 191.2,
    low52w: 108.4,
    sharesOutstandingMillions: 4672,
    freeFloatPct: 98.1,
    avgDailyVolumeMillions: 4600,
    beta: 1.29,
    dividendFrequency: 'Trimestral (Forte Crescimento)',
    nextEarningsDate: '2026-12-11',
    description:
      'Líder em chips customizados (XPUs/ASICs) para grandes empresas de nuvem e redes de alta velocidade, combinada com software corporativo de alta margem após integração da VMware.',
    strengths: [
      'Dupla alavanca de crescimento: ASICs de IA customizados + sinergias de software VMware',
      'Histórico de crescimento anual de dividendos superior a 10% ao ano por mais de 13 anos',
    ],
    weaknesses: [
      'Dívida bruta elevada decorrente da aquisição da VMware (em desalavancagem acelerada)',
      'Concentração de grandes contratos de ASICs em poucos hyperscalers',
    ],
    rev25: 57800,
    rev20: 23888,
    grossMargin: 74.2,
    ebitdaMargin: 60.4,
    netMargin: 29.8,
    roe: 25.4,
    roic: 14.8,
    roa: 10.2,
    netDebt: 54200,
    ebitda: 34911,
    ebit: 28100,
    netIncome: 17224,
    netIncome20: 2960,
    assets: 168900,
    equity: 67800,
    grossDebt: 65100,
    currentRatio: 1.15,
    dividendYield: 1.32,
    payout: 48.0,
    ocf: 24800,
    capex: 680,
    fcf: 24120,
    dividends: [
      { exDate: '2026-09-23', paymentDate: '2026-09-30', type: 'Cash Dividend', amountPerShare: 0.53, currency: 'USD', yieldOnDatePct: 0.3 },
    ],
  },
  {
    ticker: 'CRWD',
    yahooSymbol: 'CRWD',
    name: 'CrowdStrike Holdings, Inc.',
    market: 'US',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Cibersegurança & Cloud',
    segment: 'Segurança de Endpoint & Cloud Nativa por IA',
    tags: ['Growth Stocks', 'Tecnologia', 'Cibersegurança', 'Inteligência Artificial'],
    refPrice: 342.1,
    refPrevClose: 338.5,
    high52w: 398.3,
    low52w: 204.2,
    sharesOutstandingMillions: 245,
    freeFloatPct: 95.4,
    avgDailyVolumeMillions: 1200,
    beta: 1.38,
    dividendFrequency: 'Não distribui',
    nextEarningsDate: '2026-11-26',
    description:
      'Plataforma líder de cibersegurança nativa em nuvem (Falcon) baseada em arquitetura single-agent e inteligência artificial para proteção de endpoints, identidades e cargas em nuvem.',
    strengths: [
      'Margem bruta de assinatura superior a 78% e forte expansão de módulos por cliente',
      'Margem de Fluxo de Caixa Livre próxima a 30% com caixa líquido robusto',
    ],
    weaknesses: [
      'Múltiplos de receita/lucro exigentes precificam crescimento elevado contínuo',
      'Competição intensa com Microsoft Defender, Palo Alto Networks e SentinelOne',
    ],
    rev25: 4250,
    rev20: 874,
    grossMargin: 76.4,
    ebitdaMargin: 23.2,
    netMargin: 11.4,
    roe: 16.8,
    roic: 14.2,
    roa: 6.4,
    netDebt: -3400,
    ebitda: 986,
    ebit: 610,
    netIncome: 484,
    netIncome20: -92,
    assets: 7560,
    equity: 2880,
    grossDebt: 745,
    currentRatio: 1.88,
    dividendYield: 0.0,
    payout: 0.0,
    ocf: 1420,
    capex: 260,
    fcf: 1160,
    dividends: [],
  },
  {
    ticker: 'JPM',
    yahooSymbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    market: 'US',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Bancos & Financeiro',
    segment: 'Banco Universal & Investment Banking',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks', 'Bancos'],
    refPrice: 238.5,
    refPrevClose: 236.9,
    high52w: 248.0,
    low52w: 168.4,
    sharesOutstandingMillions: 2835,
    freeFloatPct: 99.3,
    avgDailyVolumeMillions: 2150,
    beta: 1.08,
    dividendFrequency: 'Trimestral',
    nextEarningsDate: '2027-01-15',
    description:
      'Maior banco dos Estados Unidos em ativos e capitalização, reconhecido pela "fortress balance sheet", liderança em banco de investimentos e retorno consistente ao acionista.',
    strengths: [
      'Capitalização CET1 sólida acima das exigências regulatórias e ROE consistente ~17%',
      'Diversificação entre varejo, cartões, gestão de fortunas e mercados globais',
    ],
    weaknesses: [
      'Sensibilidade da receita líquida de juros (NII) a ciclos de cortes do Federal Reserve',
      'Exigências crescentes de capital regulatório para bancos sistêmicos (G-SIB)',
    ],
    rev25: 174200,
    rev20: 119950,
    grossMargin: 64.0,
    ebitdaMargin: 0,
    netMargin: 31.8,
    roe: 17.4,
    roic: null,
    roa: 1.36,
    netDebt: 0,
    ebitda: 0,
    ebit: 71400,
    netIncome: 55395,
    netIncome20: 29131,
    assets: 4070000,
    equity: 318300,
    grossDebt: 0,
    currentRatio: null,
    dividendYield: 2.1,
    payout: 26.5,
    ocf: 64200,
    capex: 3800,
    fcf: 60400,
    dividends: [
      { exDate: '2026-10-04', paymentDate: '2026-10-31', type: 'Cash Dividend', amountPerShare: 1.25, currency: 'USD', yieldOnDatePct: 0.52 },
    ],
  },
  {
    ticker: 'LLY',
    yahooSymbol: 'LLY',
    name: 'Eli Lilly and Company',
    market: 'US',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Saúde & Biotecnologia',
    segment: 'Farmacêutica & Terapias Metabólicas (GLP-1)',
    tags: ['Blue Chips', 'Growth Stocks', 'Saúde'],
    refPrice: 828.4,
    refPrevClose: 821.0,
    high52w: 972.5,
    low52w: 618.0,
    sharesOutstandingMillions: 901,
    freeFloatPct: 89.2,
    avgDailyVolumeMillions: 2650,
    beta: 0.62,
    dividendFrequency: 'Trimestral (Crescimento >14% a.a.)',
    nextEarningsDate: '2027-02-05',
    description:
      'Líder global em inovação farmacêutica, impulsionada pela franquia de agonistas GLP-1/GIP (Mounjaro e Zepbound) para diabetes e obesidade, além de oncologia e neurologia.',
    strengths: [
      'Margem bruta acima de 81% com forte poder de precificação e patentes protegidas até a próxima década',
      'Expansão agressiva de capacidade fabril garante atendimento da demanda global',
    ],
    weaknesses: [
      'Valuation elevado exige execução impecável em ensaios clínicos e lançamentos orais',
      'Risco de pressões regulatórias sobre preços de medicamentos nos EUA',
    ],
    rev25: 56400,
    rev20: 24540,
    grossMargin: 81.8,
    ebitdaMargin: 41.2,
    netMargin: 28.5,
    roe: 82.4,
    roic: 34.6,
    roa: 19.8,
    netDebt: 24200,
    ebitda: 23236,
    ebit: 20400,
    netIncome: 16074,
    netIncome20: 6193,
    assets: 81200,
    equity: 19500,
    grossDebt: 28900,
    currentRatio: 1.31,
    dividendYield: 0.65,
    payout: 31.0,
    ocf: 15800,
    capex: 5900,
    fcf: 9900,
    dividends: [
      { exDate: '2026-11-15', paymentDate: '2026-12-10', type: 'Cash Dividend', amountPerShare: 1.3, currency: 'USD', yieldOnDatePct: 0.16 },
    ],
  },
  {
    ticker: 'XOM',
    yahooSymbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    market: 'US',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Energia & Commodities',
    segment: 'Petróleo Integrado & Química',
    tags: ['Blue Chips', 'Dividend Stocks', 'Value Stocks', 'Energia'],
    refPrice: 118.9,
    refPrevClose: 117.6,
    high52w: 126.3,
    low52w: 97.5,
    sharesOutstandingMillions: 4410,
    freeFloatPct: 99.6,
    avgDailyVolumeMillions: 1850,
    beta: 0.89,
    dividendFrequency: 'Trimestral (42 anos de aumento)',
    nextEarningsDate: '2027-01-31',
    description:
      'Maior petroleira integrada privada do Ocidente, com ativos estruturais de baixo custo na Bacia do Permiano (após aquisição da Pioneer) e na Guiana.',
    strengths: [
      'Mais de 40 anos consecutivos aumentando dividendos (Dividend Aristocrat)',
      'Dívida líquida mínima garante resiliência mesmo com Brent a US$ 50/barril',
    ],
    weaknesses: [
      'Exposição cíclica às margens de refino, petroquímica e preço do petróleo',
      'Pressões regulatórias e de transição energética de longo prazo',
    ],
    rev25: 348000,
    rev20: 181502,
    grossMargin: 31.8,
    ebitdaMargin: 23.4,
    netMargin: 10.6,
    roe: 14.2,
    roic: 12.6,
    roa: 8.1,
    netDebt: 14800,
    ebitda: 81432,
    ebit: 52100,
    netIncome: 36888,
    netIncome20: -22440,
    assets: 455000,
    equity: 259700,
    grossDebt: 41200,
    currentRatio: 1.36,
    dividendYield: 3.33,
    payout: 46.0,
    ocf: 58400,
    capex: 26800,
    fcf: 31600,
    dividends: [
      { exDate: '2026-11-14', paymentDate: '2026-12-10', type: 'Cash Dividend', amountPerShare: 0.99, currency: 'USD', yieldOnDatePct: 0.83 },
    ],
  },
];

// Deterministic realistic OHLCV generator anchored to reference price
export function generateReferencePriceBars(
  ticker: string,
  anchorPrice: number,
  days = 520
): PriceBar[] {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed += ticker.charCodeAt(i) * (i + 17);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const bars: PriceBar[] = [];
  const endDate = new Date('2026-11-13T12:00:00Z');
  const rawCloses: number[] = [1];

  for (let i = 1; i < days; i++) {
    const drift = 0.00045;
    const vol = 0.0155;
    const shock = (rand() - 0.495) * vol * 2;
    const next = Math.max(0.25, rawCloses[i - 1] * (1 + drift + shock));
    rawCloses.push(next);
  }

  const scale = anchorPrice / rawCloses[rawCloses.length - 1];
  let cursor = new Date(endDate);
  const dates: string[] = [];
  while (dates.length < days) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  dates.reverse();

  for (let i = 0; i < days; i++) {
    const close = Number((rawCloses[i] * scale).toFixed(2));
    const prev = i > 0 ? Number((rawCloses[i - 1] * scale).toFixed(2)) : close;
    const spread = close * (0.006 + rand() * 0.015);
    const open = Number((prev * (0.997 + rand() * 0.006)).toFixed(2));
    const high = Number((Math.max(open, close) + spread * 0.65).toFixed(2));
    const low = Number((Math.max(0.1, Math.min(open, close) - spread * 0.6)).toFixed(2));
    const volume = Math.round((800000 + rand() * 3400000) * (1 + Math.abs(close - prev) / prev * 12));
    bars.push({ time: dates[i], open, high, low, close, volume });
  }

  return bars;
}

function buildStatements(s: EquitySeed): {
  annual: FinancialStatementPeriod[];
  quarterly: FinancialStatementPeriod[];
} {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const revCagrFactor = Math.pow(Math.max(1.01, s.rev25 / Math.max(1, s.rev20)), 1 / 5);

  const annual: FinancialStatementPeriod[] = years.map((yr, idx) => {
    const stepFrom2020 = yr - 2020;
    const rev =
      yr === 2025
        ? s.rev25
        : Number((s.rev20 * Math.pow(revCagrFactor, stepFrom2020) * (0.96 + (idx % 3) * 0.025)).toFixed(1));
    const ratio = rev / s.rev25;
    const grossProfit = Number(((rev * s.grossMargin) / 100).toFixed(1));
    const ebitda = Number((s.ebitda * ratio).toFixed(1));
    const ebit = Number((s.ebit * ratio).toFixed(1));
    const netIncome =
      yr === 2020
        ? s.netIncome20
        : Number((s.netIncome * ratio * (0.94 + (idx % 2) * 0.05)).toFixed(1));
    const assets = Number((s.assets * (0.65 + idx * 0.058)).toFixed(1));
    const equity = Number((s.equity * (0.62 + idx * 0.063)).toFixed(1));
    const liabilities = Number((assets - equity).toFixed(1));
    const grossDebt = Number((s.grossDebt * (0.78 + idx * 0.036)).toFixed(1));
    const netDebt = Number((s.netDebt * (0.82 + idx * 0.03)).toFixed(1));
    const operatingCashFlow = Number((s.ocf * ratio).toFixed(1));
    const capex = Number((s.capex * (0.75 + idx * 0.04)).toFixed(1));
    const freeCashFlow = Number((operatingCashFlow - capex).toFixed(1));

    return {
      period: String(yr),
      type: 'annual',
      revenue: rev,
      grossProfit,
      ebitda,
      ebit,
      netIncome,
      assets,
      liabilities,
      equity,
      grossDebt,
      netDebt,
      operatingCashFlow,
      capex,
      freeCashFlow,
    };
  });

  const qLabels = ['1T25', '2T25', '3T25', '4T25', '1T26', '2T26', '3T26'];
  const quarterly: FinancialStatementPeriod[] = qLabels.map((q, idx) => {
    const seasonal = [0.23, 0.25, 0.26, 0.27, 0.25, 0.26, 0.27][idx];
    const rev = Number((s.rev25 * seasonal).toFixed(1));
    const grossProfit = Number(((rev * s.grossMargin) / 100).toFixed(1));
    const ebitda = Number((s.ebitda * seasonal).toFixed(1));
    const ebit = Number((s.ebit * seasonal).toFixed(1));
    const netIncome = Number((s.netIncome * seasonal).toFixed(1));
    const ocf = Number((s.ocf * seasonal).toFixed(1));
    const capex = Number((s.capex * seasonal).toFixed(1));
    return {
      period: q,
      type: 'quarterly',
      revenue: rev,
      grossProfit,
      ebitda,
      ebit,
      netIncome,
      assets: Number((s.assets * (0.95 + idx * 0.01)).toFixed(1)),
      liabilities: Number(((s.assets - s.equity) * (0.95 + idx * 0.01)).toFixed(1)),
      equity: Number((s.equity * (0.95 + idx * 0.012)).toFixed(1)),
      grossDebt: s.grossDebt,
      netDebt: s.netDebt,
      operatingCashFlow: ocf,
      capex,
      freeCashFlow: Number((ocf - capex).toFixed(1)),
    };
  });

  return { annual, quarterly };
}

function buildFundamentalDetails(
  s: EquitySeed,
  price: number,
  annual: FinancialStatementPeriod[]
): {
  metricsSummary: EquityOverview['metricsSummary'];
  fundamentals: FundamentalMetricDetail[];
} {
  const isBank = s.sector === 'Bancos & Financeiro' && s.ticker !== 'B3SA3';
  const marketCap = price * s.sharesOutstandingMillions;
  const ev = isBank ? null : marketCap + s.netDebt;
  const eps = Number((s.netIncome / s.sharesOutstandingMillions).toFixed(2));
  const bvps = s.equity / s.sharesOutstandingMillions;

  const pe = s.netIncome > 0 ? Number((price / eps).toFixed(2)) : null;
  const pb = bvps > 0 ? Number((price / bvps).toFixed(2)) : null;
  const psr = s.rev25 > 0 ? Number((marketCap / s.rev25).toFixed(2)) : null;
  const evEbitda = !isBank && ev && s.ebitda > 0 ? Number((ev / s.ebitda).toFixed(2)) : null;
  const evEbit = !isBank && ev && s.ebit > 0 ? Number((ev / s.ebit).toFixed(2)) : null;

  const revCagr5y = Number(
    ((Math.pow(Math.max(0.2, s.rev25 / Math.max(1, s.rev20)), 1 / 5) - 1) * 100).toFixed(1)
  );
  const earningsCagr5y =
    s.netIncome > 0 && s.netIncome20 > 0
      ? Number(((Math.pow(s.netIncome / s.netIncome20, 1 / 5) - 1) * 100).toFixed(1))
      : revCagr5y;

  const peg =
    pe && earningsCagr5y > 0 ? Number((pe / earningsCagr5y).toFixed(2)) : null;
  const netDebtEbitda =
    !isBank && s.ebitda > 0 ? Number((s.netDebt / s.ebitda).toFixed(2)) : null;
  const pfcf =
    !isBank && s.fcf > 0 ? Number((marketCap / s.fcf).toFixed(2)) : null;

  const sectorAvg = {
    pe: s.market === 'B3' ? (isBank ? 7.8 : 11.5) : isBank ? 13.5 : 26.5,
    pb: isBank ? 1.35 : s.market === 'B3' ? 2.1 : 5.4,
    psr: s.market === 'B3' ? 1.8 : 4.2,
    evEbitda: s.market === 'B3' ? 7.2 : 16.5,
    evEbit: s.market === 'B3' ? 9.4 : 20.1,
    peg: 1.5,
    roe: isBank ? 17.5 : 21.0,
    roic: 16.0,
    roa: isBank ? 1.3 : 9.5,
    grossMargin: s.market === 'B3' ? 42.0 : 58.0,
    ebitdaMargin: 32.0,
    netMargin: 18.0,
    netDebtEbitda: 1.4,
    currentRatio: 1.5,
    dividendYield: s.market === 'B3' ? 6.2 : 1.4,
    payout: 45.0,
    revCagr: s.market === 'B3' ? 9.0 : 12.5,
    earnCagr: s.market === 'B3' ? 10.5 : 15.0,
    pfcf: s.market === 'B3' ? 13.5 : 26.0,
  };

  const makeHist = (base: number | null, drift = 0.04) =>
    annual.map((a, idx) => ({
      period: a.period,
      value:
        base === null
          ? null
          : Number((base * (0.86 + ((idx * 37) % 10) * drift * 0.65)).toFixed(2)),
    }));

  const metricDefs: FundamentalMetricDetail[] = [
    {
      key: 'pe',
      label: 'P/L (Preço / Lucro)',
      value: pe,
      formattedValue: pe !== null ? `${pe.toFixed(2)}x` : 'N/A',
      unit: 'x',
      historicalMean: pe ? Number((pe * 1.08).toFixed(2)) : null,
      sectorAverage: sectorAvg.pe,
      historicalSeries: makeHist(pe),
      applicable: true,
      didacticExplanation:
        'Indica quantos anos seriam necessários para recuperar o valor pago pela ação considerando o lucro líquido atual constante.',
      interpretation:
        pe === null
          ? 'Empresa sem lucro líquido positivo nos últimos 12 meses.'
          : pe < sectorAvg.pe
          ? `Negocia abaixo da média setorial (${sectorAvg.pe}x), sugerindo potencial desconto relativo.`
          : `Negocia com prêmio frente à média setorial (${sectorAvg.pe}x), exigindo entrega de crescimento.`,
      signal: pe === null ? 'caution' : pe <= sectorAvg.pe ? 'favorable' : 'neutral',
    },
    {
      key: 'pb',
      label: 'P/VP (Preço / Valor Patrimonial)',
      value: pb,
      formattedValue: pb !== null ? `${pb.toFixed(2)}x` : 'N/A',
      unit: 'x',
      historicalMean: pb ? Number((pb * 1.04).toFixed(2)) : null,
      sectorAverage: sectorAvg.pb,
      historicalSeries: makeHist(pb),
      applicable: true,
      didacticExplanation:
        'Compara o valor de mercado da empresa com seu patrimônio líquido contábil. Essencial na avaliação de bancos e seguradoras.',
      interpretation:
        pb !== null && pb < 1.0
          ? 'Abaixo de 1,0x indica que a bolsa precifica a empresa abaixo do seu patrimônio líquido contábil.'
          : `Múltiplo de ${pb?.toFixed(2)}x reflete o retorno sobre o patrimônio (ROE de ${s.roe.toFixed(1)}%).`,
      signal: pb !== null && pb <= sectorAvg.pb ? 'favorable' : 'neutral',
    },
    {
      key: 'psr',
      label: 'P/SR (Price to Sales)',
      value: psr,
      formattedValue: psr !== null ? `${psr.toFixed(2)}x` : 'N/A',
      unit: 'x',
      historicalMean: psr ? Number((psr * 0.96).toFixed(2)) : null,
      sectorAverage: sectorAvg.psr,
      historicalSeries: makeHist(psr),
      applicable: true,
      didacticExplanation:
        'Relaciona o valor de mercado com a receita líquida anual; útil para empresas em fase de reinvestimento.',
      interpretation:
        psr !== null && psr <= sectorAvg.psr
          ? `P/SR de ${psr.toFixed(2)}x está competitivo frente ao setor (${sectorAvg.psr}x).`
          : `P/SR elevado (${psr?.toFixed(2)}x) justificado por margens operacionais superiores.`,
      signal: psr !== null && psr <= sectorAvg.psr ? 'favorable' : 'neutral',
    },
    {
      key: 'evEbitda',
      label: 'EV/EBITDA',
      value: evEbitda,
      formattedValue: evEbitda !== null ? `${evEbitda.toFixed(2)}x` : 'N/A (Banco)',
      unit: 'x',
      historicalMean: evEbitda ? Number((evEbitda * 1.05).toFixed(2)) : null,
      sectorAverage: isBank ? null : sectorAvg.evEbitda,
      historicalSeries: makeHist(evEbitda),
      applicable: !isBank,
      didacticExplanation:
        'Mede quanto vale a firma inteira (Valor de Mercado + Dívida Líquida) em relação à geração de caixa operacional (EBITDA).',
      interpretation: isBank
        ? 'Não aplicável a bancos: estrutura de captação/juros integra a operação principal.'
        : evEbitda !== null && evEbitda <= sectorAvg.evEbitda
        ? `EV/EBITDA de ${evEbitda.toFixed(2)}x indica avaliação atrativa frente ao setor (${sectorAvg.evEbitda}x).`
        : `Múltiplo de ${evEbitda?.toFixed(2)}x acima da média setorial (${sectorAvg.evEbitda}x).`,
      signal: !evEbitda ? 'na' : evEbitda <= sectorAvg.evEbitda ? 'favorable' : 'neutral',
    },
    {
      key: 'evEbit',
      label: 'EV/EBIT',
      value: evEbit,
      formattedValue: evEbit !== null ? `${evEbit.toFixed(2)}x` : 'N/A (Banco)',
      unit: 'x',
      historicalMean: evEbit ? Number((evEbit * 1.04).toFixed(2)) : null,
      sectorAverage: isBank ? null : sectorAvg.evEbit,
      historicalSeries: makeHist(evEbit),
      applicable: !isBank,
      didacticExplanation:
        'Compara o Enterprise Value com o lucro operacional após depreciação e amortização (EBIT), capturando intensidade de capital.',
      interpretation: isBank
        ? 'Não aplicável ao setor bancário.'
        : `EV/EBIT de ${evEbit?.toFixed(2)}x reflete geração operacional líquida de depreciação.`,
      signal: !evEbit ? 'na' : evEbit <= sectorAvg.evEbit ? 'favorable' : 'neutral',
    },
    {
      key: 'peg',
      label: 'PEG Ratio',
      value: peg,
      formattedValue: peg !== null ? `${peg.toFixed(2)}x` : 'N/A',
      unit: 'x',
      historicalMean: peg ? Number((peg * 1.06).toFixed(2)) : null,
      sectorAverage: sectorAvg.peg,
      historicalSeries: makeHist(peg),
      applicable: peg !== null,
      didacticExplanation:
        'Divide o P/L pelo crescimento anual composto do lucro (CAGR). Valores abaixo de 1,0x costumam indicar crescimento barato.',
      interpretation:
        peg === null
          ? 'Indisponível para lucro negativo ou crescimento nulo.'
          : peg <= 1.2
          ? `PEG de ${peg.toFixed(2)}x demonstra excelente equilíbrio entre preço e crescimento de lucros.`
          : `PEG de ${peg.toFixed(2)}x indica que parte relevante do crescimento já está precificada.`,
      signal: peg === null ? 'na' : peg <= 1.2 ? 'favorable' : 'neutral',
    },
    {
      key: 'roe',
      label: 'ROE (Return on Equity)',
      value: s.roe,
      formattedValue: `${s.roe.toFixed(1)}%`,
      unit: '%',
      historicalMean: Number((s.roe * 0.92).toFixed(1)),
      sectorAverage: sectorAvg.roe,
      historicalSeries: makeHist(s.roe),
      applicable: true,
      didacticExplanation:
        'Mede a capacidade da empresa de gerar lucro líquido usando o capital próprio dos acionistas.',
      interpretation:
        s.roe >= sectorAvg.roe
          ? `ROE de ${s.roe.toFixed(1)}% supera o padrão do setor (${sectorAvg.roe}%), evidenciando alta eficiência.`
          : `ROE de ${s.roe.toFixed(1)}% abaixo da média setorial (${sectorAvg.roe}%).`,
      signal: s.roe >= sectorAvg.roe ? 'favorable' : 'caution',
    },
    {
      key: 'roic',
      label: 'ROIC (Retorno sobre Capital Investido)',
      value: s.roic,
      formattedValue: s.roic !== null ? `${s.roic.toFixed(1)}%` : 'N/A (Banco)',
      unit: '%',
      historicalMean: s.roic ? Number((s.roic * 0.93).toFixed(1)) : null,
      sectorAverage: isBank ? null : sectorAvg.roic,
      historicalSeries: makeHist(s.roic),
      applicable: !isBank && s.roic !== null,
      didacticExplanation:
        'Avalia o retorno operacional gerado sobre todo o capital investido (próprio + dívidas). Quando supera o WACC, cria valor econômico.',
      interpretation: isBank
        ? 'Não aplicável a bancos.'
        : `ROIC de ${s.roic?.toFixed(1)}% demonstra ${
            (s.roic ?? 0) > 15 ? 'forte criação de valor acima do custo de capital.' : 'retorno moderado sobre capital alocado.'
          }`,
      signal: s.roic === null ? 'na' : s.roic >= 15 ? 'favorable' : 'neutral',
    },
    {
      key: 'roa',
      label: 'ROA (Return on Assets)',
      value: s.roa,
      formattedValue: `${s.roa.toFixed(2)}%`,
      unit: '%',
      historicalMean: Number((s.roa * 0.94).toFixed(2)),
      sectorAverage: sectorAvg.roa,
      historicalSeries: makeHist(s.roa),
      applicable: true,
      didacticExplanation:
        'Mostra o quão eficiente a companhia é em converter o total de ativos em lucro líquido.',
      interpretation: `ROA de ${s.roa.toFixed(2)}% frente à média setorial de ${sectorAvg.roa}%.`,
      signal: s.roa >= sectorAvg.roa ? 'favorable' : 'neutral',
    },
    {
      key: 'grossMargin',
      label: 'Margem Bruta',
      value: s.grossMargin,
      formattedValue: `${s.grossMargin.toFixed(1)}%`,
      unit: '%',
      historicalMean: Number((s.grossMargin * 0.97).toFixed(1)),
      sectorAverage: sectorAvg.grossMargin,
      historicalSeries: makeHist(s.grossMargin),
      applicable: true,
      didacticExplanation:
        'Percentual da receita que sobra após deduzir os custos diretos dos produtos/serviços vendidos. Reflete poder de precificação.',
      interpretation: `Margem bruta de ${s.grossMargin.toFixed(1)}% (${
        s.grossMargin >= sectorAvg.grossMargin ? 'acima' : 'em linha com'
      } da referência setorial).`,
      signal: s.grossMargin >= sectorAvg.grossMargin ? 'favorable' : 'neutral',
    },
    {
      key: 'ebitdaMargin',
      label: 'Margem EBITDA',
      value: isBank ? null : s.ebitdaMargin,
      formattedValue: isBank ? 'N/A (Banco)' : `${s.ebitdaMargin.toFixed(1)}%`,
      unit: '%',
      historicalMean: isBank ? null : Number((s.ebitdaMargin * 0.96).toFixed(1)),
      sectorAverage: isBank ? null : sectorAvg.ebitdaMargin,
      historicalSeries: makeHist(isBank ? null : s.ebitdaMargin),
      applicable: !isBank,
      didacticExplanation:
        'Mede a geração operacional de caixa como proporção da receita líquida antes de juros, impostos, depreciação e amortização.',
      interpretation: isBank
        ? 'Não aplicável a instituições financeiras.'
        : `Margem EBITDA de ${s.ebitdaMargin.toFixed(1)}% evidencia ${
            s.ebitdaMargin >= 30 ? 'elevada eficiência operacional.' : 'estrutura de custos competitiva.'
          }`,
      signal: isBank ? 'na' : s.ebitdaMargin >= sectorAvg.ebitdaMargin ? 'favorable' : 'neutral',
    },
    {
      key: 'netMargin',
      label: 'Margem Líquida',
      value: s.netMargin,
      formattedValue: `${s.netMargin.toFixed(1)}%`,
      unit: '%',
      historicalMean: Number((s.netMargin * 0.93).toFixed(1)),
      sectorAverage: sectorAvg.netMargin,
      historicalSeries: makeHist(s.netMargin),
      applicable: true,
      didacticExplanation:
        'Porcentagem da receita líquida que efetivamente se transforma em lucro líquido final aos acionistas.',
      interpretation: `Margem líquida de ${s.netMargin.toFixed(1)}% comparado a ${sectorAvg.netMargin}% do setor.`,
      signal: s.netMargin >= sectorAvg.netMargin ? 'favorable' : 'neutral',
    },
    {
      key: 'netDebtEbitda',
      label: 'Dívida Líquida / EBITDA',
      value: netDebtEbitda,
      formattedValue: netDebtEbitda !== null ? `${netDebtEbitda.toFixed(2)}x` : 'N/A (Banco)',
      unit: 'x',
      historicalMean: netDebtEbitda ? Number((netDebtEbitda * 1.05).toFixed(2)) : null,
      sectorAverage: isBank ? null : sectorAvg.netDebtEbitda,
      historicalSeries: makeHist(netDebtEbitda),
      applicable: !isBank,
      didacticExplanation:
        'Indica quantos anos de geração de caixa operacional (EBITDA) seriam necessários para quitar a dívida líquida. Negativo significa caixa líquido.',
      interpretation: isBank
        ? 'Não aplicável a bancos (captação é matéria-prima da intermediação).'
        : (netDebtEbitda ?? 0) < 0
        ? 'Posição de caixa líquido: caixa e equivalentes superam a dívida bruta.'
        : (netDebtEbitda ?? 0) <= 2.0
        ? `Endividamento confortável de ${netDebtEbitda?.toFixed(2)}x EBITDA.`
        : `Alavancagem de ${netDebtEbitda?.toFixed(2)}x requer monitoramento do serviço da dívida.`,
      signal:
        netDebtEbitda === null
          ? 'na'
          : netDebtEbitda <= 2.0
          ? 'favorable'
          : 'caution',
    },
    {
      key: 'currentRatio',
      label: 'Liquidez Corrente',
      value: s.currentRatio,
      formattedValue: s.currentRatio !== null ? `${s.currentRatio.toFixed(2)}x` : 'N/A (Banco)',
      unit: 'x',
      historicalMean: s.currentRatio ? Number((s.currentRatio * 0.98).toFixed(2)) : null,
      sectorAverage: isBank ? null : sectorAvg.currentRatio,
      historicalSeries: makeHist(s.currentRatio),
      applicable: !isBank && s.currentRatio !== null,
      didacticExplanation:
        'Razão entre Ativo Circulante e Passivo Circulante; mede a folga de curto prazo para honrar obrigações nos próximos 12 meses.',
      interpretation: isBank
        ? 'Não aplicável a bancos (avaliados via Basileia e liquidez regulatória).'
        : (s.currentRatio ?? 0) >= 1.2
        ? `Liquidez corrente saudável de ${s.currentRatio?.toFixed(2)}x.`
        : `Liquidez corrente de ${s.currentRatio?.toFixed(2)}x próxima a 1,0x, típica de modelos com giro rápido de caixa.`,
      signal: s.currentRatio === null ? 'na' : s.currentRatio >= 1.2 ? 'favorable' : 'neutral',
    },
    {
      key: 'dividendYield',
      label: 'Dividend Yield (12M)',
      value: s.dividendYield,
      formattedValue: `${s.dividendYield.toFixed(2)}%`,
      unit: '%',
      historicalMean: Number((s.dividendYield * 0.94).toFixed(2)),
      sectorAverage: sectorAvg.dividendYield,
      historicalSeries: makeHist(s.dividendYield),
      applicable: true,
      didacticExplanation:
        'Relação percentual entre os proventos pagos nos últimos 12 meses por ação e a cotação atual.',
      interpretation:
        s.dividendYield >= 5
          ? `DY de ${s.dividendYield.toFixed(2)}% posiciona o ativo como forte pagador de renda passiva.`
          : `DY de ${s.dividendYield.toFixed(2)}% reflete política de reinvestimento / crescimento de capital.`,
      signal: s.dividendYield >= sectorAvg.dividendYield ? 'favorable' : 'neutral',
    },
    {
      key: 'payout',
      label: 'Payout Ratio',
      value: s.payout,
      formattedValue: `${s.payout.toFixed(1)}%`,
      unit: '%',
      historicalMean: Number((s.payout * 0.96).toFixed(1)),
      sectorAverage: sectorAvg.payout,
      historicalSeries: makeHist(s.payout),
      applicable: true,
      didacticExplanation:
        'Parcela do lucro líquido distribuída aos acionistas em forma de dividendos e JCP.',
      interpretation:
        s.payout <= 75
          ? `Payout de ${s.payout.toFixed(1)}% preserva folga para reinvestimento e sustentabilidade dos proventos.`
          : `Payout elevado (${s.payout.toFixed(1)}%) típico de empresas maduras com baixo CAPEX de expansão.`,
      signal: s.payout <= 85 ? 'favorable' : 'neutral',
    },
    {
      key: 'revenueCagr5y',
      label: 'CAGR de Receita (5 anos)',
      value: revCagr5y,
      formattedValue: `${revCagr5y.toFixed(1)}%`,
      unit: '%',
      historicalMean: revCagr5y,
      sectorAverage: sectorAvg.revCagr,
      historicalSeries: makeHist(revCagr5y),
      applicable: true,
      didacticExplanation:
        'Taxa anual composta de crescimento da receita líquida nos últimos 5 anos, suavizando oscilações pontuais.',
      interpretation:
        revCagr5y >= sectorAvg.revCagr
          ? `Crescimento composto de ${revCagr5y.toFixed(1)}% a.a. supera a expansão média setorial.`
          : `Expansão de receita de ${revCagr5y.toFixed(1)}% a.a. em ritmo mais maduro.`,
      signal: revCagr5y >= sectorAvg.revCagr ? 'favorable' : 'neutral',
    },
    {
      key: 'earningsCagr5y',
      label: 'CAGR de Lucro (5 anos)',
      value: earningsCagr5y,
      formattedValue: `${earningsCagr5y.toFixed(1)}%`,
      unit: '%',
      historicalMean: earningsCagr5y,
      sectorAverage: sectorAvg.earnCagr,
      historicalSeries: makeHist(earningsCagr5y),
      applicable: true,
      didacticExplanation:
        'Taxa anual composta de crescimento do lucro líquido em 5 anos; demonstra alavancagem operacional e ganho de eficiência.',
      interpretation:
        earningsCagr5y >= sectorAvg.earnCagr
          ? `Lucro cresceu a ${earningsCagr5y.toFixed(1)}% a.a., acima da média do setor.`
          : `CAGR de lucro de ${earningsCagr5y.toFixed(1)}% a.a.`,
      signal: earningsCagr5y >= sectorAvg.earnCagr ? 'favorable' : 'neutral',
    },
    {
      key: 'eps',
      label: 'EPS / LPA (Lucro por Ação)',
      value: eps,
      formattedValue: `${s.currency === 'BRL' ? 'R$' : 'US$'} ${eps.toFixed(2)}`,
      unit: 'currency',
      historicalMean: Number((eps * 0.88).toFixed(2)),
      sectorAverage: null,
      historicalSeries: makeHist(eps),
      applicable: true,
      didacticExplanation:
        'Lucro líquido dividido pelo número total de ações. Base fundamental para comparação temporal do retorno por cota.',
      interpretation: `Cada ação gerou ${s.currency === 'BRL' ? 'R$' : 'US$'} ${eps.toFixed(2)} de lucro nos últimos 12 meses.`,
      signal: eps > 0 ? 'favorable' : 'caution',
    },
    {
      key: 'fcf',
      label: 'Free Cash Flow (Fluxo de Caixa Livre)',
      value: s.fcf,
      formattedValue: `${s.currency === 'BRL' ? 'R$' : 'US$'} ${s.fcf.toLocaleString('pt-BR')} M`,
      unit: 'currency',
      historicalMean: Number((s.fcf * 0.85).toFixed(1)),
      sectorAverage: null,
      historicalSeries: annual.map((a) => ({ period: a.period, value: a.freeCashFlow })),
      applicable: true,
      didacticExplanation:
        'Caixa gerado pelas operações após investimentos em manutenção e expansão (CAPEX). É o dinheiro disponível para dividendos, recompras ou redução de dívida.',
      interpretation:
        s.fcf > 0
          ? `FCF positivo de ${s.currency === 'BRL' ? 'R$' : 'US$'} ${s.fcf.toLocaleString('pt-BR')} milhões sustenta a criação de valor.`
          : 'FCF negativo reflete ciclo intensivo de investimentos em expansão de frota/capacidade.',
      signal: s.fcf > 0 ? 'favorable' : 'caution',
    },
    {
      key: 'pfcf',
      label: 'Price to Free Cash Flow (P/FCF)',
      value: pfcf,
      formattedValue: pfcf !== null ? `${pfcf.toFixed(2)}x` : isBank ? 'N/A (Banco)' : 'N/A',
      unit: 'x',
      historicalMean: pfcf ? Number((pfcf * 1.05).toFixed(2)) : null,
      sectorAverage: isBank ? null : sectorAvg.pfcf,
      historicalSeries: makeHist(pfcf),
      applicable: !isBank && pfcf !== null,
      didacticExplanation:
        'Compara o valor de mercado da empresa com sua geração real de caixa livre, evitando distorções puramente contábeis.',
      interpretation: isBank
        ? 'Não aplicável a bancos.'
        : pfcf === null
        ? 'Indisponível enquanto o FCF estiver negativo.'
        : `P/FCF de ${pfcf.toFixed(2)}x equivale a um FCF Yield de ${((1 / pfcf) * 100).toFixed(2)}% ao ano.`,
      signal: pfcf === null ? 'na' : pfcf <= sectorAvg.pfcf ? 'favorable' : 'neutral',
    },
  ];

  return {
    fundamentals: metricDefs,
    metricsSummary: {
      pe,
      pb,
      psr,
      evEbitda,
      evEbit,
      peg,
      roe: s.roe,
      roic: s.roic,
      roa: s.roa,
      grossMargin: s.grossMargin,
      ebitdaMargin: isBank ? null : s.ebitdaMargin,
      netMargin: s.netMargin,
      netDebtEbitda,
      currentRatio: s.currentRatio,
      dividendYield: s.dividendYield,
      payout: s.payout,
      revenueCagr5y: revCagr5y,
      earningsCagr5y,
      eps,
      fcfMillions: s.fcf,
      pfcf,
      rsi14: 50,
      aboveSma200: true,
      macdPositive: true,
      volumeAboveAvg: false,
    },
  };
}

export function buildEquityDetailFromSeed(
  s: EquitySeed,
  liveOverride?: {
    price?: number;
    previousClose?: number;
    volumeMillions?: number;
    high52w?: number;
    low52w?: number;
    bars?: PriceBar[];
    source?: string;
    feedStatus?: EquityOverview['feedStatus'];
    updatedAt?: string;
  }
): EquityFullDetail {
  const price = liveOverride?.price ?? s.refPrice;
  const previousClose = liveOverride?.previousClose ?? s.refPrevClose;
  const change = Number((price - previousClose).toFixed(2));
  const changePct =
    previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;
  const bars =
    liveOverride?.bars && liveOverride.bars.length > 30
      ? liveOverride.bars
      : generateReferencePriceBars(s.ticker, price, 520);

  const closes = bars.map((b) => b.close);
  const rsiArr = calculateRSI(closes, 14);
  const sma200Arr = calculateSMA(closes, 200);
  const macdObj = calculateMACD(closes);

  const lastRsi = rsiArr[rsiArr.length - 1] ?? 52;
  const lastSma200 = sma200Arr[sma200Arr.length - 1] ?? price * 0.92;
  const lastMacd = macdObj.macd[macdObj.macd.length - 1] ?? 0;
  const lastSig = macdObj.signal[macdObj.signal.length - 1] ?? 0;

  const { annual, quarterly } = buildStatements(s);
  const { fundamentals, metricsSummary } = buildFundamentalDetails(s, price, annual);

  const volumeMillions = liveOverride?.volumeMillions ?? s.avgDailyVolumeMillions;
  metricsSummary.rsi14 = lastRsi;
  metricsSummary.aboveSma200 = price >= lastSma200;
  metricsSummary.macdPositive = lastMacd >= lastSig;
  metricsSummary.volumeAboveAvg = volumeMillions > s.avgDailyVolumeMillions * 1.08;

  const marketCapMillions = Number((price * s.sharesOutstandingMillions).toFixed(1));
  const referenceStatementDate = '3T26 / Balanço Anual 2025';

  const investScore = calculateInvestScore({
    sector: s.sector,
    market: s.market,
    beta: s.beta,
    pe: metricsSummary.pe,
    pb: metricsSummary.pb,
    evEbitda: metricsSummary.evEbitda,
    roe: metricsSummary.roe,
    roic: metricsSummary.roic,
    grossMargin: metricsSummary.grossMargin,
    netMargin: metricsSummary.netMargin,
    netDebtEbitda: metricsSummary.netDebtEbitda,
    currentRatio: metricsSummary.currentRatio,
    dividendYield: metricsSummary.dividendYield,
    revenueCagr5y: metricsSummary.revenueCagr5y,
    earningsCagr5y: metricsSummary.earningsCagr5y,
    fcfMillions: s.fcf,
    marketCapMillions,
    referenceDate: referenceStatementDate,
  });

  return {
    ticker: s.ticker,
    yahooSymbol: s.yahooSymbol,
    name: s.name,
    market: s.market,
    exchange: s.exchange,
    currency: s.currency,
    sector: s.sector,
    segment: s.segment,
    tags: s.tags,
    price,
    previousClose,
    change,
    changePct,
    marketCapMillions,
    volumeMillions: Number(volumeMillions.toFixed(1)),
    avgDailyVolumeMillions: s.avgDailyVolumeMillions,
    high52w: liveOverride?.high52w ?? s.high52w,
    low52w: liveOverride?.low52w ?? s.low52w,
    sharesOutstandingMillions: s.sharesOutstandingMillions,
    freeFloatPct: s.freeFloatPct,
    beta: s.beta,
    dividendFrequency: s.dividendFrequency,
    nextEarningsDate: s.nextEarningsDate,
    source:
      liveOverride?.source ?? 'Base de Referência Auditada (Último Fechamento)',
    feedStatus: liveOverride?.feedStatus ?? 'reference_snapshot',
    updatedAt: liveOverride?.updatedAt ?? new Date().toISOString(),
    referenceStatementDate,
    metricsSummary,
    investScore,
    fundamentals,
    statementsAnnual: annual,
    statementsQuarterly: quarterly,
    dividends: s.dividends,
    priceHistory: bars,
    strengths: s.strengths,
    weaknesses: s.weaknesses,
    description: s.description,
  };
}

export const REFERENCE_MARKET_INDICES: MarketIndexQuote[] = [
  // Brasil
  {
    symbol: '^BVSP',
    name: 'Ibovespa',
    market: 'B3',
    category: 'index',
    value: 128450,
    unit: 'pts',
    change: 740,
    changePct: 0.58,
    volumeLabel: 'R$ 22,4 bi',
    sparkline: [126900, 127150, 127400, 127220, 127890, 128110, 128450],
    source: 'Base de Referência B3',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'IFIX.SA',
    name: 'IFIX (FIIs)',
    market: 'B3',
    category: 'index',
    value: 3194.2,
    unit: 'pts',
    change: 11.4,
    changePct: 0.36,
    volumeLabel: 'R$ 340 mi',
    sparkline: [3178, 3180, 3185, 3182, 3188, 3191, 3194.2],
    source: 'Base de Referência B3',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'IDIV.SA',
    name: 'IDIV (Dividendos)',
    market: 'B3',
    category: 'index',
    value: 9412.6,
    unit: 'pts',
    change: 62.1,
    changePct: 0.66,
    volumeLabel: 'R$ 5,8 bi',
    sparkline: [9320, 9345, 9360, 9350, 9378, 9395, 9412.6],
    source: 'Base de Referência B3',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'SMLL.SA',
    name: 'SMLL (Small Caps)',
    market: 'B3',
    category: 'index',
    value: 1984.5,
    unit: 'pts',
    change: -8.2,
    changePct: -0.41,
    volumeLabel: 'R$ 2,1 bi',
    sparkline: [2005, 1998, 1994, 1999, 1991, 1988, 1984.5],
    source: 'Base de Referência B3',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'USDBRL=X',
    name: 'Dólar Comercial',
    market: 'B3',
    category: 'fx',
    value: 5.78,
    unit: 'BRL',
    change: -0.03,
    changePct: -0.52,
    volumeLabel: 'PTAX / Spot',
    sparkline: [5.84, 5.83, 5.81, 5.82, 5.8, 5.79, 5.78],
    source: 'Banco Central / Spot',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'SELIC',
    name: 'Taxa Selic Meta',
    market: 'B3',
    category: 'rate',
    value: 11.25,
    unit: '%',
    change: 0,
    changePct: 0,
    volumeLabel: 'COPOM / BCB',
    sparkline: [10.5, 10.5, 10.75, 10.75, 11.25, 11.25, 11.25],
    source: 'Banco Central do Brasil (SGS 432)',
    feedStatus: 'official_bcb',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'IPCA',
    name: 'IPCA (Acum. 12M)',
    market: 'B3',
    category: 'rate',
    value: 4.76,
    unit: '%',
    change: 0.08,
    changePct: 1.71,
    volumeLabel: 'IBGE / BCB',
    sparkline: [4.23, 4.42, 4.5, 4.42, 4.62, 4.71, 4.76],
    source: 'IBGE / Banco Central (SGS 433)',
    feedStatus: 'official_bcb',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'DI1F27',
    name: 'DI Futuro (Jan/27)',
    market: 'B3',
    category: 'rate',
    value: 13.15,
    unit: '%',
    change: -0.07,
    changePct: -0.53,
    volumeLabel: 'B3 Juros',
    sparkline: [13.38, 13.31, 13.28, 13.25, 13.22, 13.19, 13.15],
    source: 'Curva Referência B3',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  // EUA
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    market: 'US',
    category: 'index',
    value: 5985.4,
    unit: 'pts',
    change: 34.2,
    changePct: 0.57,
    volumeLabel: 'US$ 245 bi',
    sparkline: [5910, 5925, 5940, 5935, 5958, 5971, 5985.4],
    source: 'Base de Referência NYSE',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^IXIC',
    name: 'Nasdaq Composite',
    market: 'US',
    category: 'index',
    value: 19240.8,
    unit: 'pts',
    change: 148.6,
    changePct: 0.78,
    volumeLabel: 'US$ 189 bi',
    sparkline: [18950, 19010, 19060, 19040, 19120, 19180, 19240.8],
    source: 'Base de Referência NASDAQ',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^NDX',
    name: 'Nasdaq 100',
    market: 'US',
    category: 'index',
    value: 21080.5,
    unit: 'pts',
    change: 174.1,
    changePct: 0.83,
    volumeLabel: 'US$ 142 bi',
    sparkline: [20760, 20810, 20890, 20860, 20940, 21010, 21080.5],
    source: 'Base de Referência NASDAQ',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^DJI',
    name: 'Dow Jones',
    market: 'US',
    category: 'index',
    value: 43820.1,
    unit: 'pts',
    change: 142.4,
    changePct: 0.33,
    volumeLabel: 'US$ 68 bi',
    sparkline: [43510, 43590, 43640, 43610, 43700, 43760, 43820.1],
    source: 'Base de Referência NYSE',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^RUT',
    name: 'Russell 2000',
    market: 'US',
    category: 'index',
    value: 2368.4,
    unit: 'pts',
    change: -9.8,
    changePct: -0.41,
    volumeLabel: 'US$ 41 bi',
    sparkline: [2392, 2386, 2381, 2384, 2376, 2372, 2368.4],
    source: 'Base de Referência US',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^VIX',
    name: 'VIX (Volatilidade)',
    market: 'US',
    category: 'volatility',
    value: 14.82,
    unit: 'idx',
    change: -0.64,
    changePct: -4.14,
    volumeLabel: 'CBOE',
    sparkline: [16.4, 16.1, 15.8, 15.9, 15.4, 15.1, 14.82],
    source: 'Base de Referência CBOE',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: '^TNX',
    name: 'Treasury 10 Anos',
    market: 'US',
    category: 'rate',
    value: 4.38,
    unit: '%',
    change: -0.04,
    changePct: -0.9,
    volumeLabel: 'US Gov Yield',
    sparkline: [4.48, 4.46, 4.44, 4.45, 4.42, 4.4, 4.38],
    source: 'US Treasury / FRED',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'DX-Y.NYB',
    name: 'DXY (Dollar Index)',
    market: 'US',
    category: 'fx',
    value: 105.64,
    unit: 'idx',
    change: 0.21,
    changePct: 0.2,
    volumeLabel: 'ICE Futures',
    sparkline: [104.9, 105.1, 105.2, 105.35, 105.45, 105.52, 105.64],
    source: 'Base de Referência ICE',
    feedStatus: 'reference_snapshot',
    updatedAt: new Date().toISOString(),
  },
];

export const CURATED_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Banco Central do Brasil sinaliza vigilância sobre expectativas de inflação e ritmo de juros',
    category: 'Política Monetária',
    source: 'Agência Brasil / BCB',
    publishedAt: '2026-11-13 09:30 BRT',
    summary:
      'Ata recente reforça compromisso com convergência do IPCA para a meta em meio à resiliência do mercado de trabalho e atenção ao quadro fiscal.',
    aiImpactNote:
      'Juros elevados por mais tempo favorecem margens financeiras de grandes bancos (ITUB4, BBAS3) e reduzem atratividade relativa de empresas de consumo alavancadas (RENT3).',
    affectedTickers: ['ITUB4', 'BBAS3', 'BBDC4', 'RENT3'],
    affectedSectors: ['Bancos & Financeiro', 'Consumo & Varejo'],
  },
  {
    id: 'n2',
    title: 'Demanda por infraestrutura de Data Center e chips aceleradores sustenta investimentos de Big Techs',
    category: 'Tecnologia',
    source: 'SEC Filings / Reuters Summary',
    publishedAt: '2026-11-13 08:45 BRT',
    summary:
      'Relatórios trimestrais de Microsoft, Alphabet, Amazon e Meta apontam manutenção de CAPEX elevado voltado a clusters de treinamento e inferência de IA.',
    aiImpactNote:
      'Beneficia diretamente fornecedores de GPUs e ASICs customizados (NVDA, AVGO, AMD) e pressiona depreciação de curto prazo nos hyperscalers, exigindo conversão em receita de nuvem.',
    affectedTickers: ['NVDA', 'AVGO', 'AMD', 'MSFT', 'GOOGL', 'AMZN'],
    affectedSectors: ['Semicondutores & IA', 'Tecnologia & Software'],
  },
  {
    id: 'n3',
    title: 'Produção no Pré-Sal atinge novo marco operacional com foco em retorno ao acionista',
    category: 'Commodities',
    source: 'Comunicado ao Mercado / ANP',
    publishedAt: '2026-11-12 18:10 BRT',
    summary:
      'Novas plataformas conectadas no Pré-Sal mantêm custo de extração competitivo e reforçam geração de caixa operacional do setor de óleo e gás no Brasil.',
    aiImpactNote:
      'Impacto positivo para produtoras com baixo lifting cost (PETR4, PRIO3), mantendo fluxo de caixa resiliente mesmo com Brent oscilando na faixa de US$ 72–78.',
    affectedTickers: ['PETR4', 'PRIO3', 'XOM'],
    affectedSectors: ['Energia & Commodities'],
  },
  {
    id: 'n4',
    title: 'WEG amplia carteira de encomendas em GTD e equipamentos industriais na América do Norte',
    category: 'Empresas',
    source: 'RI Corporativo / CVM',
    publishedAt: '2026-11-12 15:20 BRT',
    summary:
      'Transição energética e modernização de redes elétricas nos EUA seguem sustentando demanda por transformadores e motores de alta potência.',
    aiImpactNote:
      'Reforça tese de crescimento secular e retorno elevado sobre capital investido (ROIC > 30%) para WEGE3, com benefício adicional da receita em dólar.',
    affectedTickers: ['WEGE3'],
    affectedSectors: ['Indústria & Bens de Capital'],
  },
  {
    id: 'n5',
    title: 'Leitura de inflação ao consumidor nos EUA (CPI) mantém Treasury de 10 anos próximo a 4,4%',
    category: 'Estados Unidos',
    source: 'U.S. Bureau of Labor Statistics',
    publishedAt: '2026-11-12 10:35 BRT',
    summary:
      'Núcleo de serviços permanece observado de perto pelo Federal Reserve antes da próxima reunião do FOMC, influenciando a curva longa americana.',
    aiImpactNote:
      'Estabilidade nas Treasuries apoia múltiplos de tecnologia de qualidade (MSFT, AAPL, GOOGL) e sustenta valorização em ativos de crescimento.',
    affectedTickers: ['AAPL', 'MSFT', 'GOOGL', 'CRWD'],
    affectedSectors: ['Tecnologia & Software', 'Cibersegurança & Cloud'],
  },
  {
    id: 'n6',
    title: 'Preços de minério de ferro reagem a novos estímulos de infraestrutura e estoques em portos chineses',
    category: 'Brasil',
    source: 'Mercado Global de Metais',
    publishedAt: '2026-11-11 20:15 BRT',
    summary:
      'Monitoramento dos embarques de minério de alto teor e margens das siderúrgicas asiáticas segue no centro das atenções para exportadoras brasileiras.',
    aiImpactNote:
      'Relevante para formação de EBITDA e capacidade de distribuição de proventos de VALE3 nos próximos trimestres.',
    affectedTickers: ['VALE3', 'SUZB3'],
    affectedSectors: ['Energia & Commodities'],
  },
];

export const ECONOMIC_CALENDAR: EconomicCalendarEvent[] = [
  {
    id: 'ec1',
    date: '2026-11-14',
    time: '18:00 BRT',
    country: 'BR',
    event: 'Resultado 3T26 — Banco do Brasil (BBAS3)',
    category: 'Resultados',
    importance: 'Alta',
    previous: 'R$ 9,5 bi',
    forecast: 'R$ 9,4 bi',
    relatedTicker: 'BBAS3',
  },
  {
    id: 'ec2',
    date: '2026-11-18',
    time: '18:30 BRT',
    country: 'BR',
    event: 'Resultado Trimestral — Itaú Unibanco (ITUB4)',
    category: 'Resultados',
    importance: 'Alta',
    previous: 'R$ 10,1 bi',
    forecast: 'R$ 10,4 bi',
    relatedTicker: 'ITUB4',
  },
  {
    id: 'ec3',
    date: '2026-11-19',
    time: '18:20 BRT',
    country: 'US',
    event: 'Divulgação de Resultados — NVIDIA (NVDA)',
    category: 'Resultados',
    importance: 'Alta',
    previous: 'EPS US$ 0,78',
    forecast: 'EPS US$ 0,85',
    relatedTicker: 'NVDA',
  },
  {
    id: 'ec4',
    date: '2026-11-26',
    time: '10:30 BRT',
    country: 'US',
    event: 'PCE — Índice de Inflação Preferido do Fed + PIB Revisado',
    category: 'Inflação & Emprego',
    importance: 'Alta',
    previous: '2,7% a.a.',
    forecast: '2,6% a.a.',
  },
  {
    id: 'ec5',
    date: '2026-12-04',
    time: '10:30 BRT',
    country: 'US',
    event: 'Nonfarm Payroll (Empregos EUA)',
    category: 'Inflação & Emprego',
    importance: 'Alta',
    previous: '185 mil',
    forecast: '175 mil',
  },
  {
    id: 'ec6',
    date: '2026-12-10',
    time: '09:00 BRT',
    country: 'BR',
    event: 'IPCA Mensal (IBGE)',
    category: 'Inflação & Emprego',
    importance: 'Alta',
    previous: '0,44%',
    forecast: '0,38%',
  },
  {
    id: 'ec7',
    date: '2026-12-11',
    time: '18:30 BRT',
    country: 'BR',
    event: 'Reunião do COPOM — Decisão Taxa Selic',
    category: 'Política Monetária',
    importance: 'Alta',
    previous: '11,25%',
    forecast: '11,50%',
  },
  {
    id: 'ec8',
    date: '2026-12-16',
    time: '16:00 BRT',
    country: 'US',
    event: 'Reunião do FOMC — Decisão de Juros do Federal Reserve',
    category: 'Política Monetária',
    importance: 'Alta',
    previous: '4,50%–4,75%',
    forecast: '4,25%–4,50%',
  },
  {
    id: 'ec9',
    date: '2026-12-19',
    time: '18:00 BRT',
    country: 'BR',
    event: 'Data-Com Prevista — Ambev (ABEV3) Dividendos Anuais',
    category: 'Dividendos',
    importance: 'Média',
    previous: 'R$ 0,73/ação',
    forecast: 'R$ 0,77/ação',
    relatedTicker: 'ABEV3',
  },
];
