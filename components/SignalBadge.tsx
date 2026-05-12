interface Props {
  signal: 'Long' | 'Short' | 'Neutral' | null;
  size?: 'sm' | 'md';
}

export default function SignalBadge({ signal, size = 'md' }: Props) {
  const base = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';
  const cls = {
    Long: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Short: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    Neutral: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }[signal ?? 'Neutral'];
  return (
    <span className={`${base} ${cls} rounded font-semibold uppercase tracking-wide`}>
      {signal ?? 'Neutral'}
    </span>
  );
}
