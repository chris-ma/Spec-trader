import type { OHLCVBar, SignalResult } from '@/types';
import { ema, rsi, atr } from './indicators';

export function computeKronosSignal(bars: OHLCVBar[]): SignalResult | null {
  // bars sorted oldest → newest; need at least 210 for EMA-200
  if (bars.length < 30) return null;

  const closes = bars.map((b) => b.close);
  const last = closes.length - 1;

  const ema9Series = ema(closes, 9);
  const ema21Series = ema(closes, 21);
  const ema200Series = ema(closes, 200);

  const ema9Now = ema9Series[last];
  const ema21Now = ema21Series[last];
  const ema200Now = ema200Series[last];
  const lastClose = closes[last];

  // Trend bias
  let trend_bias: 'bullish' | 'bearish' | 'neutral';
  if (lastClose > ema200Now * 1.001) trend_bias = 'bullish';
  else if (lastClose < ema200Now * 0.999) trend_bias = 'bearish';
  else trend_bias = 'neutral';

  // Flow signal: EMA-9/21 alignment vs trend bias
  const emaAbove = ema9Now > ema21Now;
  let flowSignal: 'Long' | 'Short' | 'Neutral';
  if (trend_bias === 'bullish' && emaAbove) flowSignal = 'Long';
  else if (trend_bias === 'bearish' && !emaAbove) flowSignal = 'Short';
  else flowSignal = 'Neutral';

  // Gamma strength: RSI exits oversold/overbought
  const { current: rsiNow, prev: rsiPrev } = rsi(closes, 14);
  let gamma_strength: 'buy_setup' | 'sell_setup' | 'neutral';
  if (rsiPrev <= 30 && rsiNow > 30) gamma_strength = 'buy_setup';
  else if (rsiPrev >= 70 && rsiNow < 70) gamma_strength = 'sell_setup';
  else gamma_strength = 'neutral';

  // Combined signal
  let kronos_signal: 'Long' | 'Short' | 'Neutral';
  if (flowSignal === 'Long' && gamma_strength !== 'sell_setup') kronos_signal = 'Long';
  else if (flowSignal === 'Short' && gamma_strength !== 'buy_setup') kronos_signal = 'Short';
  else kronos_signal = 'Neutral';

  // Levels
  const atr14 = atr(bars, 14);
  let entry_zone_low: number | null = null;
  let entry_zone_high: number | null = null;
  let stop_loss: number | null = null;
  let target_1: number | null = null;
  let target_2: number | null = null;

  if (kronos_signal !== 'Neutral' && atr14 > 0) {
    entry_zone_low = lastClose - 0.25 * atr14;
    entry_zone_high = lastClose + 0.25 * atr14;
    if (kronos_signal === 'Long') {
      stop_loss = lastClose - 1.5 * atr14;
      target_1 = lastClose + 2.0 * atr14;
      target_2 = lastClose + 4.0 * atr14;
    } else {
      stop_loss = lastClose + 1.5 * atr14;
      target_1 = lastClose - 2.0 * atr14;
      target_2 = lastClose - 4.0 * atr14;
    }
  }

  // Confidence score
  let score = 0;

  // Trend agreement (40 pts)
  if ((kronos_signal === 'Long' && trend_bias === 'bullish') ||
      (kronos_signal === 'Short' && trend_bias === 'bearish')) {
    score += 40;
  } else if (trend_bias === 'neutral') {
    score += 10;
  }

  // EMA spread width (20 pts)
  const emaSpreadPct = Math.abs(ema9Now - ema21Now) / lastClose * 100;
  if (emaSpreadPct > 2.0) score += 20;
  else if (emaSpreadPct > 1.0) score += 14;
  else if (emaSpreadPct > 0.5) score += 8;
  else score += 3;

  // RSI momentum zone (25 pts)
  if (kronos_signal === 'Long') {
    if (rsiNow >= 40 && rsiNow <= 60) score += 25;
    else if (rsiNow >= 30 && rsiNow < 40) score += 18;
    else if (rsiNow > 60) score += 12;
    else score += 5;
  } else if (kronos_signal === 'Short') {
    if (rsiNow >= 40 && rsiNow <= 60) score += 25;
    else if (rsiNow > 60 && rsiNow <= 70) score += 18;
    else if (rsiNow < 40) score += 12;
    else score += 5;
  } else {
    score += 10;
  }

  // ATR/price volatility filter (15 pts)
  const atrPct = atr14 / lastClose * 100;
  if (atrPct >= 0.5 && atrPct <= 3.0) score += 15;
  else if (atrPct > 3.0 && atrPct <= 5.0) score += 10;
  else if (atrPct > 5.0) score += 4;
  else score += 6;

  const confidence_pct = Math.min(100, Math.round(score));

  return {
    last_price: lastClose,
    trend_bias,
    kronos_signal,
    gamma_strength,
    entry_zone_low,
    entry_zone_high,
    stop_loss,
    target_1,
    target_2,
    confidence_pct,
    ema_9: ema9Now,
    ema_21: ema21Now,
    ema_200: ema200Now,
    rsi_14: rsiNow,
    atr_14: atr14,
  };
}
