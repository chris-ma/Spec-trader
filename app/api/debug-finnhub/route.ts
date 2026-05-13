import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) return NextResponse.json({ error: 'POLYGON_API_KEY not set' });

  const url = `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-01-01/2024-01-31?adjusted=true&sort=asc&limit=50&apiKey=${key}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      keyPrefix: key.slice(0, 8) + '...',
      resultsCount: data.resultsCount,
      firstBar: data.results?.[0] ?? null,
      polyStatus: data.status,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
