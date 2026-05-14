'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SignalRow } from '@/types';
import FilterBar from './FilterBar';
import SignalBadge from './SignalBadge';
import TrendBadge from './TrendBadge';
import ConfidenceBar from './ConfidenceBar';
import { decimalsByPrice } from '@/lib/utils/format';

type SortKey = keyof SignalRow | 'ticker' | 'name' | 'asset_class' | 'market';

function formatPrice(n: number | null, decimals = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function relativeTime(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 23) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

function classBadge(cls: string) {
  const map: Record<string, string> = {
    equity: 'bg-blue-50 text-blue-600 border border-blue-100',
    etf: 'bg-violet-50 text-violet-600 border border-violet-100',
    commodity_fx: 'bg-amber-50 text-amber-700 border border-amber-100',
    crypto: 'bg-orange-50 text-orange-600 border border-orange-100',
  };
  const label: Record<string, string> = { equity: 'Equity', etf: 'ETF', commodity_fx: 'Cmdty/FX', crypto: 'Crypto' };
  return { style: map[cls] ?? 'bg-zinc-100 text-zinc-500', label: label[cls] ?? cls };
}

interface Props { initialData: SignalRow[] }

const COLS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'name', label: 'Name' },
  { key: 'asset_class', label: 'Class' },
  { key: 'market', label: 'Mkt' },
  { key: 'last_price', label: 'Price', numeric: true },
  { key: 'trend_bias', label: 'Trend' },
  { key: 'kronos_signal', label: 'Signal' },
  { key: 'entry_zone_low', label: 'Entry Zone', numeric: true },
  { key: 'stop_loss', label: 'Stop', numeric: true },
  { key: 'target_1', label: 'Target 1', numeric: true },
  { key: 'target_2', label: 'Target 2', numeric: true },
  { key: 'confidence_pct', label: 'Confidence', numeric: true },
  { key: 'computed_at', label: 'Updated' },
];

export default function SignalTable({ initialData }: Props) {
  const router = useRouter();
  const [assetClass, setAssetClass] = useState('');
  const [market, setMarket] = useState('');
  const [signal, setSignal] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('confidence_pct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const rows = useMemo(() => {
    let r = initialData.filter((row) => {
      if (assetClass && row.assets?.asset_class !== assetClass) return false;
      if (market && row.assets?.market !== market) return false;
      if (signal && row.kronos_signal !== signal) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!row.assets?.ticker?.toLowerCase().includes(q) &&
            !row.assets?.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    r = [...r].sort((a, b) => {
      let av: string | number | null;
      let bv: string | number | null;
      if (sortKey === 'ticker') { av = a.assets?.ticker ?? ''; bv = b.assets?.ticker ?? ''; }
      else if (sortKey === 'name') { av = a.assets?.name ?? ''; bv = b.assets?.name ?? ''; }
      else if (sortKey === 'asset_class') { av = a.assets?.asset_class ?? ''; bv = b.assets?.asset_class ?? ''; }
      else if (sortKey === 'market') { av = a.assets?.market ?? ''; bv = b.assets?.market ?? ''; }
      else { av = (a as unknown as Record<string, unknown>)[sortKey] as number | null; bv = (b as unknown as Record<string, unknown>)[sortKey] as number | null; }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return r;
  }, [initialData, assetClass, market, signal, search, sortKey, sortDir]);

  return (
    <div>
      <FilterBar
        assetClass={assetClass} market={market} signal={signal} search={search}
        onAssetClass={setAssetClass} onMarket={setMarket} onSignal={setSignal} onSearch={setSearch}
      />
      <div className="px-5 py-2 text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {rows.length} asset{rows.length !== 1 ? 's' : ''}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap transition-colors ${col.numeric ? 'text-right' : ''}`}
                  style={{ color: sortKey === col.key ? 'var(--dark)' : 'var(--muted)' }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1" style={{ color: '#F2C94C' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  No signals yet — click <strong style={{ color: 'var(--dark)' }}>Refresh Signals</strong> to fetch data.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const { style: clsStyle, label: clsLabel } = classBadge(row.assets?.asset_class ?? '');
              const decimals = decimalsByPrice(row.last_price, row.assets?.asset_class ?? '');
              return (
                <tr
                  key={row.asset_id}
                  onClick={() => router.push(`/asset/${encodeURIComponent(row.assets?.ticker ?? '')}`)}
                  className="border-b border-zinc-50 cursor-pointer transition-colors hover:bg-amber-50/40"
                >
                  <td className="px-4 py-3 font-mono font-bold text-sm whitespace-nowrap" style={{ color: 'var(--dark)' }}>
                    {row.assets?.ticker}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-sm" style={{ color: 'var(--muted)' }}>
                    {row.assets?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${clsStyle}`}>{clsLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>{row.assets?.market}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-sm" style={{ color: 'var(--dark)' }}>
                    {formatPrice(row.last_price, decimals)}
                  </td>
                  <td className="px-4 py-3">
                    <TrendBadge bias={row.trend_bias} />
                  </td>
                  <td className="px-4 py-3">
                    <SignalBadge signal={row.kronos_signal} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                    {row.entry_zone_low != null && row.entry_zone_high != null
                      ? `${formatPrice(row.entry_zone_low, decimals)}–${formatPrice(row.entry_zone_high, decimals)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-rose-500 font-medium">
                    {formatPrice(row.stop_loss, decimals)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-medium" style={{ color: '#16A34A' }}>
                    {formatPrice(row.target_1, decimals)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-medium" style={{ color: '#22C55E' }}>
                    {formatPrice(row.target_2, decimals)}
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBar value={row.confidence_pct} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                    {relativeTime(row.computed_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
