import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://stooq.com/q/d/l/?s=aapl.us&i=d', { cache: 'no-store' });
    const text = await res.text();
    const lines = text.trim().split('\n');
    return NextResponse.json({
      status: res.status,
      rows: lines.length - 1,
      header: lines[0],
      lastBar: lines[lines.length - 1],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
