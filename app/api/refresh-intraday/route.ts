import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchIntradaySeries, toYahooSymbol } from '@/lib/yahoo-finance/fetcher';
import type { AssetRecord } from '@/types';

export async function POST(req: NextRequest) {
  const { ticker } = await req.json();
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  const db = createServerClient();
  const { data: asset } = await db
    .from('assets')
    .select('*')
    .eq('ticker', ticker)
    .single();

  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  const a = asset as AssetRecord;

  // Check if intraday cache is fresh (< 60 min old)
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: cached } = await db
    .from('market_data')
    .select('fetched_at')
    .eq('asset_id', a.id)
    .eq('bar_interval', '60min')
    .order('fetched_at', { ascending: false })
    .limit(1);

  const isFresh = cached && cached.length > 0 && cached[0].fetched_at > cutoff;

  if (!isFresh) {
    try {
      const yfSymbol = toYahooSymbol(a.ticker, a.market);
      const bars = await fetchIntradaySeries(yfSymbol);
      const rows = bars.map((b) => ({
        asset_id: a.id,
        bar_interval: '60min',
        bar_date: b.bar_date,
        bar_time: b.bar_time ?? null,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
        fetched_at: new Date().toISOString(),
      }));
      await db.from('market_data').upsert(rows, {
        onConflict: 'asset_id,bar_interval,bar_date,bar_time',
        ignoreDuplicates: false,
      });
    } catch {
      // Fall through to return cached data on fetch failure
    }
  }

  const { data: intraBars } = await db
    .from('market_data')
    .select('bar_date,bar_time,open,high,low,close,volume')
    .eq('asset_id', a.id)
    .eq('bar_interval', '60min')
    .order('bar_time', { ascending: true });

  return NextResponse.json({ bars: intraBars ?? [] });
}
