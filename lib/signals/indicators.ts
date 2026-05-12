import type { OHLCVBar } from '@/types';

export function ema(closes: number[], period: number): number[] {
  if (closes.length < period) return closes.map(() => closes[0]);
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length);
  result[0] = closes[0];
  for (let i = 1; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

export function rsi(closes: number[], period = 14): { current: number; prev: number } {
  if (closes.length < period + 2) return { current: 50, prev: 50 };

  const deltas = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = deltas.map((d) => (d > 0 ? d : 0));
  const losses = deltas.map((d) => (d < 0 ? Math.abs(d) : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const computeRsi = (ag: number, al: number) => (al === 0 ? 100 : 100 - 100 / (1 + ag / al));

  let prevRsi = computeRsi(avgGain, avgLoss);
  let currentRsi = prevRsi;

  for (let i = period; i < deltas.length; i++) {
    const prevAvgGain = avgGain;
    const prevAvgLoss = avgLoss;
    avgGain = (prevAvgGain * (period - 1) + gains[i]) / period;
    avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period;
    prevRsi = currentRsi;
    currentRsi = computeRsi(avgGain, avgLoss);
  }

  return { current: currentRsi, prev: prevRsi };
}

export function atr(bars: OHLCVBar[], period = 14): number {
  if (bars.length < period + 1) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close)
    );
    trueRanges.push(tr);
  }

  let atrVal = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atrVal = (atrVal * (period - 1) + trueRanges[i]) / period;
  }

  return atrVal;
}
