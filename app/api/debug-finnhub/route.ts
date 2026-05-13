import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return NextResponse.json({ error: 'FINNHUB_API_KEY not set' });

  const from = Math.floor(new Date('2024-01-01').getTime() / 1000);
  const to = Math.floor(Date.now() / 1000);
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=${from}&to=${to}&token=${key}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      keyPrefix: key.slice(0, 8) + '...',
      response: data,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
