import yahooFinance from 'yahoo-finance2';
import type { OHLCVBar } from '@/types';

// yahoo-finance2 overloads use `this: ModuleThis` which TypeScript can't resolve
// when accessed as a property — cast once here and use typed locals below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = yahooFinance as any;

export function toYahooSymbol(ticker: string, market: string): string {
  return market === 'FOREX' ? `${ticker}=X` : ticker;
}

export async function fetchDailySeries(symbol: string): Promise<OHLCVBar[]> {
  const rows: Array<{
    date: Date;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number;
    volume: number | null;
  }> = await yf.historical(symbol, {
    period1: '2020-01-01',
    interval: '1d',
    events: 'history',
  });

  return rows
    .filter((r) => r.close != null)
    .map((r) => ({
      bar_date: r.date.toISOString().split('T')[0],
      open: r.open ?? r.close,
      high: r.high ?? r.close,
      low: r.low ?? r.close,
      close: r.close,
      volume: r.volume ?? null,
    }))
    .sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export async function fetchIntradaySeries(symbol: string): Promise<OHLCVBar[]> {
  const result: {
    quotes: Array<{
      date: Date;
      open: number | null;
      high: number | null;
      low: number | null;
      close: number | null;
      volume: number | null;
    }>;
  } = await yf.chart(symbol, { interval: '60m', range: '5d', return: 'array' });

  return result.quotes
    .filter((q) => q.close != null)
    .map((q) => ({
      bar_date: new Date(q.date).toISOString().split('T')[0],
      bar_time: new Date(q.date).toISOString(),
      open: q.open ?? q.close ?? 0,
      high: q.high ?? q.close ?? 0,
      low: q.low ?? q.close ?? 0,
      close: q.close ?? 0,
      volume: q.volume ?? null,
    }))
    .sort((a, b) => (a.bar_time ?? '').localeCompare(b.bar_time ?? ''));
}
