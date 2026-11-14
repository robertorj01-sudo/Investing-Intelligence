import { GoogleGenAI, Type } from '@google/genai';
import type { AIStockReport, EquityFullDetail, EquityOverview, MarketIndexQuote } from '../shared/types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const COMPLIANCE_SYSTEM_INSTRUCTION = `Você é o Analista de Ações Institucional da plataforma INVEST INTELLIGENCE, especializado em ações brasileiras (B3) e americanas (NYSE/NASDAQ).

REGRAS CRÍTICAS DE INTEGRIDADE E COMPLIANCE:
1. NUNCA invente cotações, lucros, balanços, dividendos, datas ou notícias. Utilize EXCLUSIVAMENTE os dados numéricos reais fornecidos no contexto JSON abaixo.
2. Se algum dado não constar no contexto, informe explicitamente que o dado não está disponível na base consultada.
3. Sempre cite a data de referência dos dados e as premissas de projeção utilizadas.
4. Diferencie claramente: Informação factual, Análise fundamentalista/técnica, Estimativa/Projeção de cenários e Disclaimer regulatório (este conteúdo tem caráter exclusivamente informativo e educacional, não constituindo recomendação individualizada de compra ou venda conforme regras da CVM e SEC).
5. Escreva em português brasileiro técnico, claro, didático e objetivo.`;

export async function generateStructuredStockReport(input: {
  question: string;
  targetEquities: EquityFullDetail[];
  macroIndices: MarketIndexQuote[];
  portfolioSummary?: unknown;
}): Promise<AIStockReport> {
  const ai = getGeminiClient();

  const groundedContext = {
    referenceTimestamp: new Date().toISOString(),
    macroEnvironment: input.macroIndices.map((m) => ({
      symbol: m.symbol,
      name: m.name,
      market: m.market,
      value: m.value,
      unit: m.unit,
      changePct: m.changePct,
      source: m.source,
    })),
    equitiesData: input.targetEquities.map((e) => ({
      ticker: e.ticker,
      name: e.name,
      market: e.market,
      exchange: e.exchange,
      currency: e.currency,
      sector: e.sector,
      segment: e.segment,
      price: e.price,
      changePct: e.changePct,
      marketCapMillions: e.marketCapMillions,
      high52w: e.high52w,
      low52w: e.low52w,
      dataSource: e.source,
      referenceStatementDate: e.referenceStatementDate,
      metricsSummary: e.metricsSummary,
      investScore: e.investScore,
      latestAnnualStatements: e.statementsAnnual.slice(-4),
      latestDividends: e.dividends.slice(0, 3),
      strengths: e.strengths,
      weaknesses: e.weaknesses,
    })),
    portfolioContext: input.portfolioSummary ?? null,
  };

  const prompt = `Solicitação do investidor: "${input.question}"

DADOS VERIFICADOS DO BANCO DE DADOS E PROVEDORES DE MERCADO:
${JSON.stringify(groundedContext, null, 2)}

Produza um relatório completo e rigoroso estruturado nas 10 seções obrigatórias, fundamentado estritamente nos dados fornecidos acima.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction: COMPLIANCE_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          tickersAnalyzed: { type: Type.ARRAY, items: { type: Type.STRING } },
          dataReferenceDate: { type: Type.STRING },
          disclaimer: { type: Type.STRING },
          assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          sections: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              companyQuality: { type: Type.STRING },
              growth: { type: Type.STRING },
              profitability: { type: Type.STRING },
              financialHealth: { type: Type.STRING },
              valuation: { type: Type.STRING },
              upsidePotential: { type: Type.STRING },
              risks: { type: Type.STRING },
              scenarios: {
                type: Type.OBJECT,
                properties: {
                  optimistic: { type: Type.STRING },
                  base: { type: Type.STRING },
                  pessimistic: { type: Type.STRING },
                },
              },
              conclusion: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as AIStockReport;
  return parsed;
}

export async function generateAnalystChatResponse(input: {
  question: string;
  universeOverview: EquityOverview[];
  macroIndices: MarketIndexQuote[];
  portfolioSummary?: unknown;
}): Promise<{ answer: string; referencedTickers: string[]; dataReferenceDate: string }> {
  const ai = getGeminiClient();

  const compactUniverse = input.universeOverview.map((e) => ({
    ticker: e.ticker,
    name: e.name,
    market: e.market,
    sector: e.sector,
    price: e.price,
    currency: e.currency,
    changePct: e.changePct,
    pe: e.metricsSummary.pe,
    pb: e.metricsSummary.pb,
    evEbitda: e.metricsSummary.evEbitda,
    roe: e.metricsSummary.roe,
    roic: e.metricsSummary.roic,
    netMargin: e.metricsSummary.netMargin,
    netDebtEbitda: e.metricsSummary.netDebtEbitda,
    dy: e.metricsSummary.dividendYield,
    revCagr5y: e.metricsSummary.revenueCagr5y,
    earnCagr5y: e.metricsSummary.earningsCagr5y,
    rsi14: e.metricsSummary.rsi14,
    investScore: e.investScore.totalScore,
    tags: e.tags,
  }));

  const prompt = `Pergunta do investidor: "${input.question}"

UNIVERSO DISPONÍVEL DE ATIVOS (DADOS REAIS/AUDITADOS):
${JSON.stringify(compactUniverse)}

CENÁRIO MACROECONÔMICO:
${JSON.stringify(
    input.macroIndices.map((m) => ({
      name: m.name,
      market: m.market,
      value: m.value,
      unit: m.unit,
      changePct: m.changePct,
    }))
  )}

${input.portfolioSummary ? `CARTEIRA DO USUÁRIO:\n${JSON.stringify(input.portfolioSummary)}` : ''}

Responda com profundidade analítica, comparando números exatos do contexto, explicando os prós, contras, valuation, análise macro e técnica (RSI/SMA200), indicando a data de referência e encerrando com aviso educativo (não recomendação individualizada).`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction: COMPLIANCE_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          referencedTickers: { type: Type.ARRAY, items: { type: Type.STRING } },
          dataReferenceDate: { type: Type.STRING },
        },
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  return JSON.parse(rawText);
}
