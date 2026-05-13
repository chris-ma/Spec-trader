import type { OHLCVBar } from '@/types';

const BASE = 'https://api.polygon.io';

function apiKey() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error('POLYGON_API_KEY is not set');
  return key;
}

// ── Stooq fallback for ASX stocks (no API key required) ──────────────────────
// Symbol format: BHP.AX → bhp.au, CBA.AX → cba.au, etc.
async function fetchStooqDaily(ticker: string): Promise<OHLCVBar[]> {
  const symbol = ticker.replace('.AX', '').toLowerCase() + '.au';
  const url = `https://stooq.com/q/d/l/?s=${symbol}&i=d`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Stooq ${res.status} for ${symbol}`);
  const text = await res.text();
  if (text.includes('No data') || !text.includes(',')) throw new Error(`Stooq returned no data for ${symbol}`);

  const lines = text.trim().split('\n').slice(1); // skip header
  return lines
    .map((line) => {
      const [date, open, high, low, close, volume] = line.split(',');
      return {
        bar_date: date?.trim(),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: volume ? parseInt(volume, 10) || null : null,
      };
    })
    .filter((b) => b.bar_date && !isNaN(b.close))
    .sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

// ── Polygon aggregates ────────────────────────────────────────────────────────
function toPolygonTicker(ticker: string, market: string): string {
  if (market === 'FOREX') return `C:${ticker}`;
  return ticker;
}

interface PolyAgg { t: number; o: number; h: number; l: number; c: number; v: number }

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

  const data = (await res.json()) as { status: string; results?: PolyAgg[] };
  if (!data.results?.length) throw new Error(`No data for ${symbol} (status: ${data.status})`);

  if (timespan === 'day') {
    return data.results.map((r) => ({
      bar_date: new Date(r.t).toISOString().split('T')[0],
      open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v ?? null,
    }));
  }

  return data.results.map((r) => ({
    bar_date: new Date(r.t).toISOString().split('T')[0],
    bar_time: new Date(r.t).toISOString(),
    open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v ?? null,
  }));
}

// ── Public API ────────────────────────────────────────────────────────────────
export function fetchDailySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  if (market === 'ASX') return fetchStooqDaily(ticker);
  return fetchAggs(toPolygonTicker(ticker, market), 1, 'day', '2020-01-01');
}

export function fetchIntradaySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  if (market === 'ASX') {
    // Stooq doesn't support intraday — return empty so chart falls back to daily
    return Promise.resolve([]);
  }
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return fetchAggs(toPolygonTicker(ticker, market), 60, 'minute', from);
}
