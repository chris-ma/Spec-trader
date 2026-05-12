interface Props {
  bias: 'bullish' | 'bearish' | 'neutral' | null;
}

export default function TrendBadge({ bias }: Props) {
  const cls = {
    bullish: 'text-emerald-400',
    bearish: 'text-rose-400',
    neutral: 'text-slate-400',
  }[bias ?? 'neutral'];
  const icon = { bullish: '↑', bearish: '↓', neutral: '→' }[bias ?? 'neutral'];
  const label = bias ? bias.charAt(0).toUpperCase() + bias.slice(1) : 'Neutral';
  return (
    <span className={`${cls} font-medium text-sm`}>
      {icon} {label}
    </span>
  );
}
