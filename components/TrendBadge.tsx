interface Props {
  bias: 'bullish' | 'bearish' | 'neutral' | null;
}

export default function TrendBadge({ bias }: Props) {
  const cfg = {
    bullish: { icon: '↑', label: 'Bullish', cls: 'text-emerald-600 font-semibold' },
    bearish: { icon: '↓', label: 'Bearish', cls: 'text-rose-500 font-semibold' },
    neutral: { icon: '→', label: 'Neutral', cls: 'text-zinc-400 font-medium' },
  }[bias ?? 'neutral'];
  return (
    <span className={`text-sm ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}
