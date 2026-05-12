interface Props {
  value: number | null;
}

export default function ConfidenceBar({ value }: Props) {
  const pct = value ?? 0;
  const color =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-slate-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-7 text-right">{pct}%</span>
    </div>
  );
}
