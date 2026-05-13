import type { OHLCVBar } from '@/types';

// Stooq symbol format:
//   US stocks/ETFs → aapl.us, spy.us
//   ASX stocks     → bhp.au, cba.au
//   Forex          → eurusd.fx, xauusd.fx
function toStooqSymbol(ticker: string, market: string): string {
  if (market === 'FOREX') return ticker.toLowerCase() + '.fx';
  if (market === 'ASX')   return ticker.replace('.AX', '').toLowerCase() + '.au';
  return ticker.toLowerCase() + '.us';
}

function parseStooqCsv(text: string): OHLCVBar[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines
    .slice(1)
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
    .filter((b) => b.bar_date && !isNaN(b.close) && !isNaN(b.open))
    .sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export async function fetchDailySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  const symbol = toStooqSymbol(ticker, market);
  const res = await fetch(`https://stooq.com/q/d/l/?s=${symbol}&i=d`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Stooq ${res.status} for ${symbol}`);
  const text = await res.text();
  if (text.includes('No data') || !text.includes(','))
    throw new Error(`No data from Stooq for ${symbol}`);
  const bars = parseStooqCsv(text);
  if (bars.length === 0) throw new Error(`Empty response from Stooq for ${symbol}`);
  return bars;
}

export async function fetchIntradaySeries(ticker: string, market: string): Promise<OHLCVBar[]> {
  // Stooq doesn't offer sub-daily free data — return empty so chart falls back to daily
  void ticker; void market;
  return [];
}
