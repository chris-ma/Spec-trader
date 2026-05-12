'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { OHLCVBar, SignalRecord } from '@/types';

type Timeframe = '1h' | 'daily' | 'weekly';

interface Props {
  ticker: string;
  dailyBars: OHLCVBar[];
  signal: SignalRecord | null;
}

function aggregateWeekly(bars: OHLCVBar[]): OHLCVBar[] {
  const weeks: Record<string, OHLCVBar> = {};
  for (const b of bars) {
    const date = new Date(b.bar_date);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    const weekKey = monday.toISOString().split('T')[0];
    if (!weeks[weekKey]) {
      weeks[weekKey] = { ...b, bar_date: weekKey };
    } else {
      const w = weeks[weekKey];
      w.high = Math.max(w.high, b.high);
      w.low = Math.min(w.low, b.low);
      w.close = b.close;
      if (w.volume != null && b.volume != null) w.volume = w.volume + b.volume;
    }
  }
  return Object.values(weeks).sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export default function AssetChart({ ticker, dailyBars, signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<import('lightweight-charts').IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [intraBars, setIntraBars] = useState<OHLCVBar[]>([]);
  const [loadingIntra, setLoadingIntra] = useState(false);

  const fetchIntraday = useCallback(async () => {
    if (intraBars.length > 0) return;
    setLoadingIntra(true);
    try {
      const res = await fetch('/api/refresh-intraday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      const json = await res.json();
      setIntraBars(json.bars ?? []);
    } catch {
      // silently fail; chart will be empty
    } finally {
      setLoadingIntra(false);
    }
  }, [ticker, intraBars.length]);

  useEffect(() => {
    if (timeframe === '1h') fetchIntraday();
  }, [timeframe, fetchIntraday]);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    async function initChart() {
      const { createChart, CandlestickSeries, LineSeries } = await import('lightweight-charts');
      if (destroyed || !containerRef.current) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#334155' },
        timeScale: { borderColor: '#334155', timeVisible: true },
        width: containerRef.current.clientWidth,
        height: 380,
      });
      chartRef.current = chart;

      // Select bars based on timeframe
      let bars: OHLCVBar[];
      if (timeframe === '1h') bars = intraBars;
      else if (timeframe === 'weekly') bars = aggregateWeekly(dailyBars);
      else bars = dailyBars;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });

      const candleData = bars.map((b) => ({
        time: (timeframe === '1h' && b.bar_time
          ? Math.floor(new Date(b.bar_time).getTime() / 1000)
          : b.bar_date) as import('lightweight-charts').Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));
      candleSeries.setData(candleData);

      // EMA lines (daily/weekly only)
      if (timeframe !== '1h' && bars.length > 9) {
        const closes = bars.map((b) => b.close);
        const k9 = 2 / (9 + 1);
        const k21 = 2 / (21 + 1);
        let e9 = closes[0];
        let e21 = closes[0];
        const ema9Data: { time: import('lightweight-charts').Time; value: number }[] = [];
        const ema21Data: { time: import('lightweight-charts').Time; value: number }[] = [];

        for (let i = 0; i < bars.length; i++) {
          e9 = closes[i] * k9 + e9 * (1 - k9);
          e21 = closes[i] * k21 + e21 * (1 - k21);
          const t = bars[i].bar_date as import('lightweight-charts').Time;
          ema9Data.push({ time: t, value: e9 });
          ema21Data.push({ time: t, value: e21 });
        }

        const ema9Series = chart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 1, title: 'EMA 9' });
        ema9Series.setData(ema9Data);
        const ema21Series = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, title: 'EMA 21' });
        ema21Series.setData(ema21Data);
      }

      // Price lines for signal levels
      if (signal && candleSeries) {
        if (signal.entry_zone_low) {
          candleSeries.createPriceLine({ price: signal.entry_zone_low, color: '#6366f1', lineWidth: 1, lineStyle: 2, title: 'Entry Low' });
        }
        if (signal.entry_zone_high) {
          candleSeries.createPriceLine({ price: signal.entry_zone_high, color: '#6366f1', lineWidth: 1, lineStyle: 2, title: 'Entry High' });
        }
        if (signal.stop_loss) {
          candleSeries.createPriceLine({ price: signal.stop_loss, color: '#f43f5e', lineWidth: 1, lineStyle: 2, title: 'Stop' });
        }
        if (signal.target_1) {
          candleSeries.createPriceLine({ price: signal.target_1, color: '#10b981', lineWidth: 1, lineStyle: 2, title: 'T1' });
        }
        if (signal.target_2) {
          candleSeries.createPriceLine({ price: signal.target_2, color: '#6ee7b7', lineWidth: 1, lineStyle: 2, title: 'T2' });
        }
      }

      chart.timeScale().fitContent();

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.resize(containerRef.current.clientWidth, 380);
      });
      if (containerRef.current) ro.observe(containerRef.current);

      return () => { ro.disconnect(); };
    }

    initChart();
    return () => { destroyed = true; };
  }, [timeframe, dailyBars, intraBars, signal]);

  return (
    <div className="space-y-3">
      {/* Timeframe tabs */}
      <div className="flex gap-1">
        {(['1h', 'daily', 'weekly'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors uppercase ${
              timeframe === tf
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tf === '1h' ? '1H' : tf === 'daily' ? 'Daily' : 'Weekly'}
          </button>
        ))}
        {loadingIntra && <span className="text-xs text-slate-500 self-center ml-2">Loading hourly…</span>}
      </div>
      <div ref={containerRef} className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900" />
    </div>
  );
}
