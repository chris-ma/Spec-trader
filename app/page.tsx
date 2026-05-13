import { supabase } from '@/lib/supabase/client';
import type { SignalRow } from '@/types';
import SignalTable from '@/components/SignalTable';
import RefreshButton from '@/components/RefreshButton';

export const revalidate = 0;

async function getSignals(): Promise<SignalRow[]> {
  const { data, error } = await supabase
    .from('signals')
    .select(`*, assets(ticker, name, asset_class, market)`)
    .order('confidence_pct', { ascending: false });

  if (error) {
    console.error('Failed to load signals:', error.message);
    return [];
  }
  return (data ?? []) as SignalRow[];
}

function StatCard({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-sm border border-zinc-100">
      <div>
        <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--dark)' }}>{value}</div>
        <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
        {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const signals = await getSignals();

  const total = signals.length;
  const longCount = signals.filter((s) => s.kronos_signal === 'Long').length;
  const shortCount = signals.filter((s) => s.kronos_signal === 'Short').length;
  const neutralCount = signals.filter((s) => s.kronos_signal === 'Neutral').length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top nav bar */}
      <header className="bg-white border-b border-zinc-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--dark)' }}>K</div>
          <span className="font-semibold text-sm" style={{ color: 'var(--dark)' }}>Kronos</span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Equities', 'ETFs', 'Forex'].map((item, i) => (
            <span
              key={item}
              className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                i === 0
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              style={i === 0 ? { background: 'var(--dark)' } : {}}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="w-24" />
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--dark)' }}>
              Trading Signals
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Kronos Flow &amp; Gamma Strength · Daily timeframe · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <RefreshButton />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value={total} label="Tracked Assets" />
          <StatCard value={longCount} label="Long Setups" sub="EMA bullish + RSI aligned" />
          <StatCard value={shortCount} label="Short Setups" sub="EMA bearish + RSI aligned" />
          <StatCard value={neutralCount} label="Neutral" sub="No clear setup" />
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Long', desc: 'EMA-9 > EMA-21 · above EMA-200 · RSI healthy', color: 'bg-amber-400 text-amber-900' },
            { label: 'Short', desc: 'EMA-9 < EMA-21 · below EMA-200 · RSI declining', color: 'bg-zinc-800 text-white' },
            { label: 'Neutral', desc: 'No confirmed setup', color: 'bg-zinc-200 text-zinc-600' },
          ].map(({ label, desc, color }) => (
            <div key={label} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-zinc-100">
              <span className={`${color} text-xs font-semibold px-2 py-0.5 rounded-full`}>{label}</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</span>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <SignalTable initialData={signals} />
        </div>

        <footer className="text-xs pb-4" style={{ color: 'var(--muted)' }}>
          Signals are computed from public technical indicator logic and are not financial advice.
          Data sourced from Finnhub. Refresh once daily.
        </footer>
      </main>
    </div>
  );
}
