interface Props {
  signal: 'Long' | 'Short' | 'Neutral' | null;
  size?: 'sm' | 'md';
}

export default function SignalBadge({ signal, size = 'md' }: Props) {
  const base = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const cls = {
    Long: 'bg-amber-400 text-amber-900',
    Short: 'bg-zinc-800 text-white',
    Neutral: 'bg-zinc-100 text-zinc-500',
  }[signal ?? 'Neutral'];
  return (
    <span className={`${base} ${cls} rounded-full font-semibold uppercase tracking-wide`}>
      {signal ?? 'Neutral'}
    </span>
  );
}
