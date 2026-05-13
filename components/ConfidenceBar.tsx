interface Props {
  value: number | null;
}

export default function ConfidenceBar({ value }: Props) {
  const pct = value ?? 0;
  const barColor = pct >= 70 ? '#F2C94C' : pct >= 45 ? '#FBBF24' : '#E4E4E7';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EFEA' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-xs font-medium w-7 text-right" style={{ color: 'var(--dark)' }}>{pct}%</span>
    </div>
  );
}
