import { supabase } from '@/lib/supabase/client';
import type { SignalRow } from '@/types';
import SignalTable from '@/components/SignalTable';
import RefreshButton from '@/components/RefreshButton';

export const revalidate = 0;

async function getSignals(): Promise<SignalRow[]> {
  const { data, error } = await supabase
    .from('signals')
    .select(`
      *,
      assets (
        ticker, name, asset_class, market
      )
    `)
    .order('confidence_pct', { ascending: false });

  if (error) {
    console.error('Failed to load signals:', error.message);
    return [];
  }
  return (data ?? []) as SignalRow[];
}

export default async function DashboardPage() {
  const signals = await getSignals();

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Kronos Signals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kronos-inspired Flow &amp; Gamma Strength signals · Daily timeframe
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
        <span><span className="text-emerald-400 font-medium">Long</span> — EMA-9 above EMA-21, price above EMA-200, RSI healthy</span>
        <span><span className="text-rose-400 font-medium">Short</span> — EMA-9 below EMA-21, price below EMA-200, RSI declining</span>
        <span><span className="text-slate-400 font-medium">Neutral</span> — No clear setup</span>
      </div>

      <SignalTable initialData={signals} />

      <footer className="text-xs text-slate-600 pt-4 border-t border-slate-800">
        Signals are computed from public technical indicator logic and are not financial advice.
        Data sourced from Alpha Vantage. Refresh once daily to stay within free tier limits.
      </footer>
    </main>
  );
}
