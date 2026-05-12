'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SignalRow } from '@/types';
import FilterBar from './FilterBar';
import SignalBadge from './SignalBadge';
import TrendBadge from './TrendBadge';
import ConfidenceBar from './ConfidenceBar';

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
    equity: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    etf: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    commodity_fx: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };
  const label: Record<string, string> = { equity: 'Equity', etf: 'ETF', commodity_fx: 'Cmdty/FX' };
  return { style: map[cls] ?? '', label: label[cls] ?? cls };
}

interface Props {
  initialData: SignalRow[];
}

const COLS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'name', label: 'Name' },
  { key: 'asset_class', label: 'Class' },
  { key: 'market', label: 'Market' },
  { key: 'last_price', label: 'Last Price', numeric: true },
  { key: 'trend_bias', label: 'Trend' },
  { key: 'kronos_signal', label: 'Signal' },
  { key: 'entry_zone_low', label: 'Entry Zone', numeric: true },
  { key: 'stop_loss', label: 'Stop Loss', numeric: true },
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
    <div className="space-y-4">
      <FilterBar
        assetClass={assetClass} market={market} signal={signal} search={search}
        onAssetClass={setAssetClass} onMarket={setMarket} onSignal={setSignal} onSearch={setSearch}
      />
      <div className="text-xs text-slate-500">{rows.length} asset{rows.length !== 1 ? 's' : ''}</div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 border-b border-slate-700">
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-200 select-none whitespace-nowrap ${col.numeric ? 'text-right' : ''}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-indigo-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-500">
                  No signals yet — click <strong className="text-slate-300">Refresh Signals</strong> to fetch data.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const { style: clsStyle, label: clsLabel } = classBadge(row.assets?.asset_class ?? '');
              const decimals = row.assets?.asset_class === 'commodity_fx' ? 4 : 2;
              return (
                <tr
                  key={row.asset_id}
                  onClick={() => router.push(`/asset/${encodeURIComponent(row.assets?.ticker ?? '')}`)}
                  className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-100 whitespace-nowrap">
                    {row.assets?.ticker}
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 max-w-[180px] truncate">
                    {row.assets?.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${clsStyle}`}>{clsLabel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{row.assets?.market}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-100">
                    {formatPrice(row.last_price, decimals)}
                  </td>
                  <td className="px-3 py-2.5">
                    <TrendBadge bias={row.trend_bias} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SignalBadge signal={row.kronos_signal} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-300 whitespace-nowrap">
                    {row.entry_zone_low != null && row.entry_zone_high != null
                      ? `${formatPrice(row.entry_zone_low, decimals)}–${formatPrice(row.entry_zone_high, decimals)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-rose-400">
                    {formatPrice(row.stop_loss, decimals)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-400">
                    {formatPrice(row.target_1, decimals)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-300">
                    {formatPrice(row.target_2, decimals)}
                  </td>
                  <td className="px-3 py-2.5">
                    <ConfidenceBar value={row.confidence_pct} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
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
