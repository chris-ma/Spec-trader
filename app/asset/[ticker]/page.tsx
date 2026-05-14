import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { AssetRecord, SignalRecord, OHLCVBar } from '@/types';
import SignalBadge from '@/components/SignalBadge';
import TrendBadge from '@/components/TrendBadge';
import ConfidenceBar from '@/components/ConfidenceBar';
import AssetChart from '@/components/AssetChart';
import { decimalsByPrice } from '@/lib/utils/format';

export const revalidate = 0;

function fmt(n: number | null, decimals = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

async function getAssetData(ticker: string) {
  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('ticker', ticker)
    .single();

  if (!asset) return { asset: null, signal: null, dailyBars: [] };

  const { data: signal } = await supabase
    .from('signals')
    .select('*')
    .eq('asset_id', asset.id)
    .single();

  const { data: bars } = await supabase
    .from('market_data')
    .select('bar_date,open,high,low,close,volume')
    .eq('asset_id', asset.id)
    .eq('bar_interval', 'daily')
    .order('bar_date', { ascending: true })
    .limit(300);

  const dailyBars: OHLCVBar[] = (bars ?? []).map((b) => ({
    bar_date: b.bar_date,
    open: Number(b.open),
    high: Number(b.high),
    low: Number(b.low),
    close: Number(b.close),
    volume: b.volume ? Number(b.volume) : null,
  }));

  return { asset: asset as AssetRecord, signal: signal as SignalRecord | null, dailyBars };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const decodedTicker = decodeURIComponent(ticker);
  const { asset, signal, dailyBars } = await getAssetData(decodedTicker);

  if (!asset) notFound();

  const decimals = decimalsByPrice(signal?.last_price ?? null, asset.asset_class);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Back nav */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Dashboard
      </Link>

      {/* Asset header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono text-slate-100">{asset.ticker}</h1>
            <span className="text-base text-slate-400">{asset.name}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-mono font-semibold text-slate-100">
              {fmt(signal?.last_price ?? null, decimals)}
            </span>
            <TrendBadge bias={signal?.trend_bias ?? null} />
            <SignalBadge signal={signal?.kronos_signal ?? null} />
            <ConfidenceBar value={signal?.confidence_pct ?? null} />
          </div>
          <div className="text-xs text-slate-500">
            {asset.asset_class.toUpperCase()} · {asset.market} · Daily
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <AssetChart ticker={asset.ticker} dailyBars={dailyBars} signal={signal} />
      </div>

      {/* Signal levels */}
      {signal && signal.kronos_signal !== 'Neutral' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Entry Zone</div>
            <div className="font-mono text-slate-100 font-semibold">
              {fmt(signal.entry_zone_low, decimals)} – {fmt(signal.entry_zone_high, decimals)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-rose-900/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Stop Loss</div>
            <div className="font-mono text-rose-400 font-semibold">{fmt(signal.stop_loss, decimals)}</div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-emerald-900/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target 1</div>
            <div className="font-mono text-emerald-400 font-semibold">{fmt(signal.target_1, decimals)}</div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-emerald-900/30 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target 2</div>
            <div className="font-mono text-emerald-300 font-semibold">{fmt(signal.target_2, decimals)}</div>
          </div>
        </div>
      )}

      {/* Indicator stats */}
      {signal && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'EMA 9', value: fmt(signal.ema_9, decimals) },
            { label: 'EMA 21', value: fmt(signal.ema_21, decimals) },
            { label: 'EMA 200', value: fmt(signal.ema_200, decimals) },
            { label: 'RSI 14', value: signal.rsi_14 != null ? signal.rsi_14.toFixed(1) : '—' },
            { label: 'ATR 14', value: fmt(signal.atr_14, decimals) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900 rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
              <div className="font-mono text-slate-200 font-medium">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Signal explanation */}
      {signal && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 text-sm text-slate-400 space-y-1">
          <h3 className="text-slate-200 font-medium mb-2">Signal Explanation</h3>
          <p>
            <strong className="text-slate-300">Trend Bias:</strong>{' '}
            {signal.trend_bias === 'bullish'
              ? `Price is above the EMA-200 (${fmt(signal.ema_200, decimals)}), indicating a longer-term bullish trend.`
              : signal.trend_bias === 'bearish'
              ? `Price is below the EMA-200 (${fmt(signal.ema_200, decimals)}), indicating a longer-term bearish trend.`
              : 'Price is near the EMA-200 — no strong trend direction.'}
          </p>
          <p>
            <strong className="text-slate-300">Flow Signal:</strong>{' '}
            {signal.ema_9 != null && signal.ema_21 != null
              ? signal.ema_9 > signal.ema_21
                ? `EMA-9 (${fmt(signal.ema_9, decimals)}) is above EMA-21 (${fmt(signal.ema_21, decimals)}) — momentum is positive.`
                : `EMA-9 (${fmt(signal.ema_9, decimals)}) is below EMA-21 (${fmt(signal.ema_21, decimals)}) — momentum is negative.`
              : '—'}
          </p>
          <p>
            <strong className="text-slate-300">Gamma Strength:</strong>{' '}
            {signal.gamma_strength === 'buy_setup'
              ? `RSI recently exited oversold territory — a buy setup is active.`
              : signal.gamma_strength === 'sell_setup'
              ? `RSI recently exited overbought territory — a sell setup is active.`
              : `RSI (${signal.rsi_14?.toFixed(1)}) is in neutral territory.`}
          </p>
        </div>
      )}

      <footer className="text-xs text-slate-600 pt-4 border-t border-slate-800">
        Not financial advice. Signals are rule-based approximations of public indicator logic.
      </footer>
    </main>
  );
}
