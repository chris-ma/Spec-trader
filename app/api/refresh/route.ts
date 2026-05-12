import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchDailySeries, fetchFxDailySeries } from '@/lib/alpha-vantage/fetcher';
import { delay } from '@/lib/alpha-vantage/rate-limiter';
import { computeKronosSignal } from '@/lib/signals/engine';
import type { AssetRecord, OHLCVBar } from '@/types';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Cron secret check: only enforced when CRON_SECRET is set AND caller sends wrong token
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();
  const { data: assets, error: assetsErr } = await db
    .from('assets')
    .select('*')
    .eq('is_active', true);

  if (assetsErr || !assets) {
    return NextResponse.json({ error: assetsErr?.message ?? 'No assets' }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  const { data: recentSignals } = await db
    .from('signals')
    .select('asset_id, computed_at')
    .gt('computed_at', cutoff);

  const recentAssetIds = new Set((recentSignals ?? []).map((s) => s.asset_id));

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i] as AssetRecord;

    if (recentAssetIds.has(asset.id)) {
      skipped++;
      continue;
    }

    try {
      // Fetch OHLCV from Alpha Vantage
      let bars: OHLCVBar[];
      if (asset.av_function === 'FX_DAILY' && asset.av_from_sym && asset.av_to_sym) {
        bars = await fetchFxDailySeries(asset.av_from_sym, asset.av_to_sym);
      } else {
        bars = await fetchDailySeries(asset.av_symbol);
      }

      if (bars.length === 0) throw new Error('Empty bar data');

      // Upsert market_data
      const marketRows = bars.map((b) => ({
        asset_id: asset.id,
        bar_interval: 'daily',
        bar_date: b.bar_date,
        bar_time: null,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
        fetched_at: new Date().toISOString(),
      }));

      await db.from('market_data').upsert(marketRows, {
        onConflict: 'asset_id,bar_interval,bar_date,bar_time',
        ignoreDuplicates: false,
      });

      // Load all stored bars for this asset (oldest first)
      const { data: storedBars } = await db
        .from('market_data')
        .select('bar_date,open,high,low,close,volume')
        .eq('asset_id', asset.id)
        .eq('bar_interval', 'daily')
        .order('bar_date', { ascending: true });

      const allBars: OHLCVBar[] = (storedBars ?? []).map((r) => ({
        bar_date: r.bar_date,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: r.volume ? Number(r.volume) : null,
      }));

      const signal = computeKronosSignal(allBars);
      if (!signal) throw new Error('Insufficient bars for signal computation');

      await db.from('signals').upsert(
        {
          asset_id: asset.id,
          last_price: signal.last_price,
          trend_bias: signal.trend_bias,
          kronos_signal: signal.kronos_signal,
          gamma_strength: signal.gamma_strength,
          entry_zone_low: signal.entry_zone_low,
          entry_zone_high: signal.entry_zone_high,
          stop_loss: signal.stop_loss,
          target_1: signal.target_1,
          target_2: signal.target_2,
          confidence_pct: signal.confidence_pct,
          ema_9: signal.ema_9,
          ema_21: signal.ema_21,
          ema_200: signal.ema_200,
          rsi_14: signal.rsi_14,
          atr_14: signal.atr_14,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'asset_id' }
      );

      updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${asset.ticker}: ${msg}`);
    }

    // Respect AV rate limit: 5 requests/min
    if (i < assets.length - 1) await delay(12000);
  }

  return NextResponse.json({ updated, skipped, errors });
}
