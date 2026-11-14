import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, FileText, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AIStockReport, EquityOverview } from '../shared/types';

const SUGGESTED_PROMPTS = [
  'Qual a melhor ação americana para crescimento nos próximos cinco anos?',
  'Compare NVIDIA e AMD considerando margens, ROIC, valuation e riscos.',
  'Quais ações estão descontadas na B3 com boa saúde financeira?',
  'Analise completamente a ação ITUB4 no cenário atual da Selic.',
  'Compare Apple, Microsoft e Google em geração de caixa e múltiplos.',
  'Minha carteira está excessivamente concentrada? (Analise meus ativos)',
];

export function AIAnalystView({
  equities,
  initialTicker,
  onSelectTicker,
}: {
  equities: EquityOverview[];
  initialTicker?: string;
  onSelectTicker: (ticker: string) => void;
}) {
  const { authFetch } = useAuth();
  const [mode, setMode] = useState<'report' | 'chat'>(initialTicker ? 'report' : 'chat');
  const [selectedTickers, setSelectedTickers] = useState<string[]>(
    initialTicker ? [initialTicker] : ['ITUB4']
  );
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AIStockReport | null>(null);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; text: string; tickers?: string[]; refDate?: string }[]
  >([]);

  useEffect(() => {
    if (initialTicker) {
      setSelectedTickers([initialTicker]);
      setMode('report');
    }
  }, [initialTicker]);

  const toggleTicker = (tk: string) => {
    setSelectedTickers((prev) =>
      prev.includes(tk)
        ? prev.length > 1
          ? prev.filter((t) => t !== tk)
          : prev
        : prev.length < 4
        ? [...prev, tk]
        : prev
    );
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/ai/report', {
        method: 'POST',
        body: JSON.stringify({
          tickers: selectedTickers,
          question: customQuestion || `Relatório institucional completo de ${selectedTickers.join(' e ')}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar relatório.');
      setReport(data.report);
    } catch (err: any) {
      setError(err?.message || 'Erro ao consultar Analista de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (promptOverride?: string) => {
    const q = (promptOverride ?? customQuestion).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    if (!promptOverride) setCustomQuestion('');

    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na resposta da IA.');
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          tickers: data.referencedTickers,
          refDate: data.dataReferenceDate,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar pergunta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-500" />
            AI Stock Analyst — Analista Fundamentalista & Macro
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Análises fundamentadas estritamente nos dados financeiros reais e cálculos determinísticos da plataforma.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              mode === 'chat'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Consulta Interativa
          </button>
          <button
            type="button"
            onClick={() => setMode('report')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md ${
              mode === 'report'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Relatório Completo (10 Seções)
          </button>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong>Aviso Regulatório (CVM / SEC):</strong> Este módulo gera análises informativas e educacionais baseadas nos balanços, múltiplos e indicadores macroeconômicos disponíveis no sistema. Projeções não constituem garantia de rentabilidade ou recomendação individualizada de investimento.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {mode === 'report' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Selecione de 1 a 4 ações para o relatório estruturado:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {equities.map((eq) => (
                  <button
                    key={eq.ticker}
                    type="button"
                    onClick={() => toggleTicker(eq.ticker)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                      selectedTickers.includes(eq.ticker)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {eq.ticker}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Foco opcional do relatório (ex: Avalie qualidade, dividendos e valuation frente aos juros)"
                className="flex-1 min-w-[260px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <FileText className="w-4 h-4" />
                {loading ? 'Gerando Relatório (IA)...' : 'Gerar Relatório de 10 Seções'}
              </button>
            </div>
          </div>

          {report && (
            <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  Ativos: {report.tickersAnalyzed.join(' · ')} · Referência dos Dados: {report.dataReferenceDate}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {report.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                {[
                  { num: '01', title: 'Resumo Executivo', body: report.sections.executiveSummary },
                  { num: '02', title: 'Qualidade da Empresa', body: report.sections.companyQuality },
                  { num: '03', title: 'Crescimento', body: report.sections.growth },
                  { num: '04', title: 'Rentabilidade', body: report.sections.profitability },
                  { num: '05', title: 'Saúde Financeira', body: report.sections.financialHealth },
                  { num: '06', title: 'Valuation', body: report.sections.valuation },
                  { num: '07', title: 'Potencial de Valorização', body: report.sections.upsidePotential },
                  { num: '08', title: 'Riscos & Pontos de Atenção', body: report.sections.risks },
                ].map((sec) => (
                  <div key={sec.num} className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {sec.num}. {sec.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                  09. Cenários (Otimista, Base e Pessimista)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">Cenário Otimista</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {report.sections.scenarios.optimistic}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-white">Cenário Base</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {report.sections.scenarios.base}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-rose-500/8 border border-rose-500/20 space-y-1">
                    <div className="font-semibold text-rose-700 dark:text-rose-400">Cenário Pessimista</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {report.sections.scenarios.pessimistic}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                  10. Conclusão Fundamentada
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {report.sections.conclusion}
                </p>
                {report.assumptions?.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Premissas:</strong> {report.assumptions.join(' · ')}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {report.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Quick Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => handleSendChat(p)}
                className="p-3 text-left text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1623] hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Conversation Feed */}
          <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 min-h-[320px] flex flex-col justify-between">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {chatHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Faça uma pergunta sobre ações da B3, NYSE/NASDAQ, múltiplos, cenário macroeconômico ou auditoria de carteira.
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-white ml-8'
                        : 'bg-emerald-500/5 border border-emerald-500/20 text-slate-800 dark:text-slate-200 mr-4'
                    }`}
                  >
                    <div className="font-semibold mb-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {msg.role === 'user' ? 'Você' : 'Analista INVEST INTELLIGENCE'}
                      {msg.refDate ? ` · Ref.: ${msg.refDate}` : ''}
                    </div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                    {msg.tickers && msg.tickers.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-2">
                        <span className="text-[11px] text-slate-500">Abrir ativo:</span>
                        {msg.tickers.map((tk) => (
                          <button
                            key={tk}
                            type="button"
                            onClick={() => onSelectTicker(tk)}
                            className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {tk}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 animate-pulse">
                  Analisando demonstrações financeiras, múltiplos e cenário macro...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ex: Compare WEGE3 e NVDA ou avalie quais ações da B3 têm ROE > 20% e P/L < 10..."
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Analisar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
