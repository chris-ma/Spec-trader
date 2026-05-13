import type { OHLCVBar } from '@/types';

const BASE = 'https://api.polygon.io';

function apiKey() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error('POLYGON_API_KEY is not set');
  return key;
}

// Polygon ticker format:
//   US stocks/ETFs → AAPL, SPY (unchanged)
//   Forex          → C:EURUSD, C:XAUUSD
//   ASX            → not on free tier; fetch attempt will fail gracefully
export function toPolygonTicker(ticker: string, market: string): string {
  if (market === 'FOREX') return `C:${ticker}`;
  if (market === 'ASX') return ticker.replace('.AX', ''); // best-effort
  return ticker;
}

interface PolyAgg {
  t: number; // timestamp ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

async function fetchAggs(
  symbol: string,
  multiplier: number,
  timespan: 'day' | 'minute',
  fromDate: string,
): Promise<OHLCVBar[]> {
  const to = new Date().toISOString().split('T')[0];
  const url =
    `${BASE}/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${timespan}` +
    `/${fromDate}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey()}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polygon ${res.status} for ${symbol}: ${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as { status: string; results?: PolyAgg[]; resultsCount?: number };
  if (!data.results?.length) throw new Error(`No data for ${symbol} (status: ${data.status})`);

  if (timespan === 'day') {
    return data.results.map((r) => ({
      bar_date: new Date(r.t).toISOString().split('T')[0],
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v ?? null,
    }));
  }

  return data.results.map((r) => ({
    bar_date: new Date(r.t).toISOString().split('T')[0],
    bar_time: new Date(r.t).toISOString(),
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v ?? null,
  }));
}

export function fetchDailySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  return fetchAggs(toPolygonTicker(ticker, market), 1, 'day', '2020-01-01');
}

export function fetchIntradaySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return fetchAggs(toPolygonTicker(ticker, market), 60, 'minute', from);
}
