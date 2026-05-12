import type { OHLCVBar } from '@/types';

const BASE_URL = 'https://www.alphavantage.co/query';

function apiKey() {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_API_KEY is not set');
  return key;
}

function checkRateLimit(data: Record<string, unknown>) {
  if ('Note' in data || 'Information' in data) {
    const msg = (data['Note'] || data['Information']) as string;
    throw new Error(`Alpha Vantage rate limit: ${msg}`);
  }
}

export async function fetchDailySeries(symbol: string): Promise<OHLCVBar[]> {
  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`AV HTTP ${res.status} for ${symbol}`);
  const data = await res.json();
  checkRateLimit(data);

  const series = data['Time Series (Daily)'] as Record<string, Record<string, string>> | undefined;
  if (!series) throw new Error(`No daily data returned for ${symbol}`);

  return Object.entries(series)
    .map(([date, v]) => ({
      bar_date: date,
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'] ?? '0', 10) || null,
    }))
    .sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export async function fetchFxDailySeries(fromSymbol: string, toSymbol: string): Promise<OHLCVBar[]> {
  const url = `${BASE_URL}?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&outputsize=full&apikey=${apiKey()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`AV HTTP ${res.status} for ${fromSymbol}${toSymbol}`);
  const data = await res.json();
  checkRateLimit(data);

  const series = data['Time Series FX (Daily)'] as Record<string, Record<string, string>> | undefined;
  if (!series) throw new Error(`No FX daily data returned for ${fromSymbol}/${toSymbol}`);

  return Object.entries(series)
    .map(([date, v]) => ({
      bar_date: date,
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: null,
    }))
    .sort((a, b) => a.bar_date.localeCompare(b.bar_date));
}

export async function fetchIntradaySeries(symbol: string, interval: '60min' = '60min'): Promise<OHLCVBar[]> {
  const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${apiKey()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`AV HTTP ${res.status} for intraday ${symbol}`);
  const data = await res.json();
  checkRateLimit(data);

  const key = `Time Series (${interval})`;
  const series = data[key] as Record<string, Record<string, string>> | undefined;
  if (!series) throw new Error(`No intraday data returned for ${symbol}`);

  return Object.entries(series)
    .map(([datetime, v]) => ({
      bar_date: datetime.split(' ')[0],
      bar_time: new Date(datetime + ' UTC').toISOString(),
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'] ?? '0', 10) || null,
    }))
    .sort((a, b) => (a.bar_time ?? '').localeCompare(b.bar_time ?? ''));
}
