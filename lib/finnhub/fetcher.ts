import type { OHLCVBar } from '@/types';

const BASE = 'https://finnhub.io/api/v1';
const FROM_TS = Math.floor(new Date('2020-01-01').getTime() / 1000);

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set');
  return key;
}

// Convert our internal ticker + market to Finnhub symbol + endpoint type
export function toFinnhubSymbol(ticker: string, market: string): { symbol: string; endpoint: 'stock' | 'forex' } {
  if (market === 'FOREX') {
    const base = ticker.slice(0, 3);
    const quote = ticker.slice(3, 6);
    return { symbol: `OANDA:${base}_${quote}`, endpoint: 'forex' };
  }
  if (market === 'ASX') {
    return { symbol: ticker.replace('.AX', ''), endpoint: 'stock' };
  }
  return { symbol: ticker, endpoint: 'stock' };
}

interface FinnhubCandles {
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  t: number[];
  v: number[];
  s: string;
}

async function fetchCandles(endpoint: 'stock' | 'forex', symbol: string): Promise<OHLCVBar[]> {
  const to = Math.floor(Date.now() / 1000);
  const url = `${BASE}/${endpoint}/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${FROM_TS}&to=${to}&token=${apiKey()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status} for ${symbol}`);
  const data = (await res.json()) as FinnhubCandles;
  if (data.s !== 'ok' || !data.t?.length) throw new Error(`No data for ${symbol} (status: ${data.s})`);

  return data.t.map((ts, i) => ({
    bar_date: new Date(ts * 1000).toISOString().split('T')[0],
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i] ?? null,
  })).sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export async function fetchDailySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  const { symbol, endpoint } = toFinnhubSymbol(ticker, market);
  return fetchCandles(endpoint, symbol);
}

export async function fetchIntradaySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  const { symbol, endpoint } = toFinnhubSymbol(ticker, market);
  const to = Math.floor(Date.now() / 1000);
  const from = to - 5 * 24 * 60 * 60; // last 5 days
  const url = `${BASE}/${endpoint}/candle?symbol=${encodeURIComponent(symbol)}&resolution=60&from=${from}&to=${to}&token=${apiKey()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status} for ${symbol}`);
  const data = (await res.json()) as FinnhubCandles;
  if (data.s !== 'ok' || !data.t?.length) return [];

  return data.t.map((ts, i) => ({
    bar_date: new Date(ts * 1000).toISOString().split('T')[0],
    bar_time: new Date(ts * 1000).toISOString(),
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i] ?? null,
  })).sort((a, b) => (a.bar_time ?? '').localeCompare(b.bar_time ?? ''));
}
