'use client';

interface Props {
  assetClass: string;
  market: string;
  signal: string;
  search: string;
  onAssetClass: (v: string) => void;
  onMarket: (v: string) => void;
  onSignal: (v: string) => void;
  onSearch: (v: string) => void;
}

const selectCls =
  'border border-zinc-200 bg-zinc-50 text-zinc-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-400 cursor-pointer';

export default function FilterBar({
  assetClass, market, signal, search,
  onAssetClass, onMarket, onSignal, onSearch,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center px-5 py-4 border-b border-zinc-100">
      <input
        type="text"
        placeholder="Search ticker / name…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="border border-zinc-200 bg-zinc-50 text-zinc-700 text-sm rounded-xl px-3 py-1.5 w-48 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-400"
      />
      <select value={assetClass} onChange={(e) => onAssetClass(e.target.value)} className={selectCls}>
        <option value="">All Classes</option>
        <option value="equity">Equity</option>
        <option value="etf">ETF</option>
        <option value="commodity_fx">Commodity / FX</option>
      </select>
      <select value={market} onChange={(e) => onMarket(e.target.value)} className={selectCls}>
        <option value="">All Markets</option>
        <option value="US">US</option>
        <option value="ASX">ASX</option>
        <option value="FOREX">FOREX</option>
      </select>
      <select value={signal} onChange={(e) => onSignal(e.target.value)} className={selectCls}>
        <option value="">All Signals</option>
        <option value="Long">Long</option>
        <option value="Short">Short</option>
        <option value="Neutral">Neutral</option>
      </select>
    </div>
  );
}
