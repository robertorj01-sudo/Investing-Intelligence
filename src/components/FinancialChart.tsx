import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import {
  calculateBollingerBands,
  calculateFibonacciRetracement,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  calculateVWAP,
  detectSupportResistance,
} from '../shared/financialEngine';
import type { EquityOverview, PriceBar } from '../shared/types';
import { useAuth } from '../context/AuthContext';
import { Crosshair, Eraser, GitCompare, PenLine, TrendingUp } from 'lucide-react';

interface FinancialChartProps {
  ticker: string;
  currency: 'BRL' | 'USD';
  bars: PriceBar[];
  allEquities?: EquityOverview[];
}

type ChartMode = 'candles' | 'area';
type TimeWindow = '1M' | '3M' | '6M' | '1A' | '2A' | '5A' | 'MAX';
type Granularity = 'D' | 'S' | 'M';

function aggregateBars(bars: PriceBar[], granularity: Granularity): PriceBar[] {
  if (granularity === 'D' || bars.length === 0) return bars;
  const groups = new Map<string, PriceBar[]>();
  for (const b of bars) {
    let key = b.time.slice(0, 7); // Monthly YYYY-MM
    if (granularity === 'S') {
      const dt = new Date(b.time + 'T12:00:00Z');
      const day = dt.getUTCDay();
      const diff = dt.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dt.setUTCDate(diff));
      key = monday.toISOString().slice(0, 10);
    }
    const list = groups.get(key) || [];
    list.push(b);
    groups.set(key, list);
  }
  const out: PriceBar[] = [];
  for (const list of groups.values()) {
    const first = list[0];
    const last = list[list.length - 1];
    out.push({
      time: last.time,
      open: first.open,
      high: Math.max(...list.map((x) => x.high)),
      low: Math.min(...list.map((x) => x.low)),
      close: last.close,
      volume: list.reduce((acc, x) => acc + x.volume, 0),
    });
  }
  return out;
}

export function FinancialChart({
  ticker,
  currency,
  bars,
  allEquities = [],
}: FinancialChartProps) {
  const { theme } = useAuth();
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const [chartMode, setChartMode] = useState<ChartMode>('candles');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1A');
  const [granularity, setGranularity] = useState<Granularity>('D');
  const [showSma, setShowSma] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVwap, setShowVwap] = useState(false);
  const [showFib, setShowFib] = useState(false);
  const [showSR, setShowSR] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [showMacd, setShowMacd] = useState(false);
  const [compareTicker, setCompareTicker] = useState<string>('');
  const [compareBars, setCompareBars] = useState<PriceBar[] | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [customLines, setCustomLines] = useState<number[]>([]);

  useEffect(() => {
    if (!compareTicker) {
      setCompareBars(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/equities/${encodeURIComponent(compareTicker)}?range=2y`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.priceHistory) {
          setCompareBars(data.priceHistory);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [compareTicker]);

  const filteredBars = useMemo(() => {
    const agg = aggregateBars(bars, granularity);
    const countMap: Record<TimeWindow, number> = {
      '1M': 22,
      '3M': 65,
      '6M': 130,
      '1A': 252,
      '2A': 504,
      '5A': 1260,
      MAX: agg.length,
    };
    const n = granularity === 'D' ? countMap[timeWindow] : agg.length;
    return agg.slice(-Math.min(agg.length, n));
  }, [bars, timeWindow, granularity]);

  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;

  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container || filteredBars.length === 0) return;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0F1623' : '#FFFFFF';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? 'rgba(148,163,184,0.07)' : 'rgba(15,23,42,0.06)';

    const chart: IChartApi = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: gridColor },
      timeScale: { borderColor: gridColor, timeVisible: true },
      width: container.clientWidth,
      height: 380,
    });

    const isComparing = Boolean(compareTicker && compareBars && compareBars.length > 0);
    let primarySeries: ISeriesApi<'Candlestick' | 'Area' | 'Line'>;

    if (isComparing && compareBars) {
      const firstBase = filteredBars[0].close;
      primarySeries = chart.addSeries(LineSeries, {
        color: '#10B981',
        lineWidth: 2,
        title: `${ticker} (%)`,
      });
      primarySeries.setData(
        filteredBars.map((b) => ({
          time: b.time as Time,
          value: Number((((b.close - firstBase) / firstBase) * 100).toFixed(2)),
        }))
      );

      const cmpMap = new Map(compareBars.map((b) => [b.time, b.close]));
      const aligned = filteredBars
        .map((b) => ({ time: b.time, close: cmpMap.get(b.time) }))
        .filter((x): x is { time: string; close: number } => x.close !== undefined);
      if (aligned.length > 0) {
        const firstCmp = aligned[0].close;
        const cmpSeries = chart.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 2,
          title: `${compareTicker} (%)`,
        });
        cmpSeries.setData(
          aligned.map((b) => ({
            time: b.time as Time,
            value: Number((((b.close - firstCmp) / firstCmp) * 100).toFixed(2)),
          }))
        );
      }
    } else if (chartMode === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16A34A',
        downColor: '#DC2626',
        borderVisible: false,
        wickUpColor: '#16A34A',
        wickDownColor: '#DC2626',
      });
      candleSeries.setData(
        filteredBars.map((b) => ({
          time: b.time as Time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );
      primarySeries = candleSeries;
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: '#10B981',
        topColor: 'rgba(16, 185, 129, 0.25)',
        bottomColor: 'rgba(16, 185, 129, 0.01)',
        lineWidth: 2,
      });
      areaSeries.setData(
        filteredBars.map((b) => ({
          time: b.time as Time,
          value: b.close,
        }))
      );
      primarySeries = areaSeries;
    }

    if (!isComparing) {
      // Volume Histogram
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volumeSeries.setData(
        filteredBars.map((b) => ({
          time: b.time as Time,
          value: b.volume,
          color:
            b.close >= b.open
              ? 'rgba(22, 163, 74, 0.28)'
              : 'rgba(220, 38, 38, 0.28)',
        }))
      );

      const closes = filteredBars.map((b) => b.close);

      if (showSma) {
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);
        const sma200 = calculateSMA(closes, 200);

        const addSma = (vals: (number | null)[], color: string, title: string) => {
          const s = chart.addSeries(LineSeries, {
            color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            title,
          });
          s.setData(
            filteredBars
              .map((b, i) => (vals[i] !== null ? { time: b.time as Time, value: vals[i]! } : null))
              .filter((x): x is { time: Time; value: number } => x !== null)
          );
        };
        addSma(sma20, '#38BDF8', 'SMA20');
        addSma(sma50, '#F59E0B', 'SMA50');
        addSma(sma200, '#A855F7', 'SMA200');
      }

      if (showBollinger) {
        const bb = calculateBollingerBands(closes, 20, 2);
        const addBand = (vals: (number | null)[], color: string) => {
          const s = chart.addSeries(LineSeries, {
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          s.setData(
            filteredBars
              .map((b, i) => (vals[i] !== null ? { time: b.time as Time, value: vals[i]! } : null))
              .filter((x): x is { time: Time; value: number } => x !== null)
          );
        };
        addBand(bb.upper, 'rgba(99, 102, 241, 0.7)');
        addBand(bb.lower, 'rgba(99, 102, 241, 0.7)');
      }

      if (showVwap) {
        const vwap = calculateVWAP(filteredBars);
        const vSeries = chart.addSeries(LineSeries, {
          color: '#EC4899',
          lineWidth: 1,
          priceLineVisible: false,
          title: 'VWAP',
        });
        vSeries.setData(
          filteredBars.map((b, i) => ({ time: b.time as Time, value: vwap[i] }))
        );
      }

      if (showFib) {
        const fibs = calculateFibonacciRetracement(filteredBars);
        fibs.forEach((f) => {
          primarySeries.createPriceLine({
            price: f.price,
            color: 'rgba(245, 158, 11, 0.55)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `Fib ${f.label}`,
          });
        });
      }

      if (showSR) {
        const sr = detectSupportResistance(filteredBars);
        sr.supports.forEach((p, idx) => {
          primarySeries.createPriceLine({
            price: p,
            color: 'rgba(16, 185, 129, 0.65)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Sup ${idx + 1}`,
          });
        });
        sr.resistances.forEach((p, idx) => {
          primarySeries.createPriceLine({
            price: p,
            color: 'rgba(239, 68, 68, 0.65)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Res ${idx + 1}`,
          });
        });
      }

      customLines.forEach((price, idx) => {
        primarySeries.createPriceLine({
          price,
          color: '#38BDF8',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Marca ${idx + 1}`,
        });
      });

      chart.subscribeClick((param) => {
        if (!drawModeRef.current || !param.point) return;
        const price = primarySeries.coordinateToPrice(param.point.y);
        if (price !== null && Number.isFinite(price)) {
          setCustomLines((prev) => [...prev, Number(price.toFixed(2))]);
          setDrawMode(false);
        }
      });
    }

    chart.timeScale().fitContent();

    // RSI sub-chart
    let rsiChart: IChartApi | null = null;
    if (showRsi && rsiContainerRef.current && !isComparing) {
      const closes = filteredBars.map((b) => b.close);
      const rsi = calculateRSI(closes, 14);
      rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: bgColor },
          textColor,
          fontFamily: 'JetBrains Mono, monospace',
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        rightPriceScale: { borderColor: gridColor },
        timeScale: { borderColor: gridColor, visible: false },
        width: rsiContainerRef.current.clientWidth,
        height: 110,
      });
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#8B5CF6',
        lineWidth: 2,
        title: 'RSI(14)',
      });
      rsiSeries.setData(
        filteredBars
          .map((b, i) => (rsi[i] !== null ? { time: b.time as Time, value: rsi[i]! } : null))
          .filter((x): x is { time: Time; value: number } => x !== null)
      );
      rsiSeries.createPriceLine({
        price: 70,
        color: 'rgba(220,38,38,0.45)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '70',
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: 'rgba(22,163,74,0.45)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '30',
      });
      rsiChart.timeScale().fitContent();
    }

    // MACD sub-chart
    let macdChart: IChartApi | null = null;
    if (showMacd && macdContainerRef.current && !isComparing) {
      const closes = filteredBars.map((b) => b.close);
      const macdObj = calculateMACD(closes);
      macdChart = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: bgColor },
          textColor,
          fontFamily: 'JetBrains Mono, monospace',
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        rightPriceScale: { borderColor: gridColor },
        timeScale: { borderColor: gridColor, visible: false },
        width: macdContainerRef.current.clientWidth,
        height: 115,
      });
      const histSeries = macdChart.addSeries(HistogramSeries, {});
      histSeries.setData(
        filteredBars
          .map((b, i) =>
            macdObj.histogram[i] !== null
              ? {
                  time: b.time as Time,
                  value: macdObj.histogram[i]!,
                  color: macdObj.histogram[i]! >= 0 ? 'rgba(22,163,74,0.65)' : 'rgba(220,38,38,0.65)',
                }
              : null
          )
          .filter((x): x is { time: Time; value: number; color: string } => x !== null)
      );
      const macdLine = macdChart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 1,
        title: 'MACD',
      });
      macdLine.setData(
        filteredBars
          .map((b, i) =>
            macdObj.macd[i] !== null ? { time: b.time as Time, value: macdObj.macd[i]! } : null
          )
          .filter((x): x is { time: Time; value: number } => x !== null)
      );
      const sigLine = macdChart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 1,
        title: 'Sinal',
      });
      sigLine.setData(
        filteredBars
          .map((b, i) =>
            macdObj.signal[i] !== null ? { time: b.time as Time, value: macdObj.signal[i]! } : null
          )
          .filter((x): x is { time: Time; value: number } => x !== null)
      );
      macdChart.timeScale().fitContent();
    }

    const observer = new ResizeObserver(() => {
      if (mainContainerRef.current) {
        chart.applyOptions({ width: mainContainerRef.current.clientWidth });
      }
      if (rsiChart && rsiContainerRef.current) {
        rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
      if (macdChart && macdContainerRef.current) {
        macdChart.applyOptions({ width: macdContainerRef.current.clientWidth });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      rsiChart?.remove();
      macdChart?.remove();
    };
  }, [
    filteredBars,
    theme,
    chartMode,
    showSma,
    showBollinger,
    showVwap,
    showFib,
    showSR,
    showRsi,
    showMacd,
    compareTicker,
    compareBars,
    customLines,
    ticker,
  ]);

  const comparableChoices = allEquities.filter((e) => e.ticker !== ticker);

  return (
    <div className="bg-white dark:bg-[#0F1623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(['candles', 'area'] as ChartMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setChartMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  chartMode === m
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m === 'candles' ? 'Candles' : 'Área'}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(['D', 'S', 'M'] as Granularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  granularity === g
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {g === 'D' ? 'Diário' : g === 'S' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(['1M', '3M', '6M', '1A', '2A', 'MAX'] as TimeWindow[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTimeWindow(w)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  timeWindow === w
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={compareTicker}
              onChange={(e) => setCompareTicker(e.target.value)}
              aria-label="Comparar ativo no gráfico"
              className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Comparar ativo...</option>
              {comparableChoices.map((c) => (
                <option key={c.ticker} value={c.ticker}>
                  {c.ticker} — {c.name.slice(0, 22)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setDrawMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              drawMode
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            {drawMode ? 'Clique no gráfico para marcar' : 'Marcar Preço'}
          </button>

          {customLines.length > 0 && (
            <button
              type="button"
              onClick={() => setCustomLines([])}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Eraser className="w-3.5 h-3.5" />
              Limpar ({customLines.length})
            </button>
          )}
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
          <TrendingUp className="w-3.5 h-3.5" /> Indicadores:
        </span>
        {[
          { label: 'Médias (20/50/200)', active: showSma, toggle: () => setShowSma((v) => !v) },
          { label: 'Bollinger', active: showBollinger, toggle: () => setShowBollinger((v) => !v) },
          { label: 'VWAP', active: showVwap, toggle: () => setShowVwap((v) => !v) },
          { label: 'Fibonacci', active: showFib, toggle: () => setShowFib((v) => !v) },
          { label: 'Suporte & Resistência', active: showSR, toggle: () => setShowSR((v) => !v) },
          { label: 'RSI (14)', active: showRsi, toggle: () => setShowRsi((v) => !v) },
          { label: 'MACD', active: showMacd, toggle: () => setShowMacd((v) => !v) },
        ].map((ind) => (
          <button
            key={ind.label}
            type="button"
            onClick={ind.toggle}
            className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              ind.active
                ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium'
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {ind.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Crosshair className="w-3 h-3" /> {ticker} ({currency})
        </span>
      </div>

      {/* Main Chart Container */}
      <div
        ref={mainContainerRef}
        className={`w-full rounded-lg overflow-hidden ${drawMode ? 'cursor-crosshair' : ''}`}
      />

      {showRsi && !compareTicker && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
            RSI (14 períodos) · Sobrecompra ≥ 70 · Sobrevenda ≤ 30
          </div>
          <div ref={rsiContainerRef} className="w-full rounded-lg overflow-hidden" />
        </div>
      )}

      {showMacd && !compareTicker && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
            MACD (12, 26, 9) · Histograma de Momento
          </div>
          <div ref={macdContainerRef} className="w-full rounded-lg overflow-hidden" />
        </div>
      )}
    </div>
  );
}
