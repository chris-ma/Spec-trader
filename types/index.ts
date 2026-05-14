export interface OHLCVBar {
  bar_date: string; // "YYYY-MM-DD"
  bar_time?: string | null; // ISO timestamp for intraday
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface AssetRecord {
  id: string;
  ticker: string;
  name: string;
  asset_class: 'equity' | 'etf' | 'commodity_fx' | 'crypto';
  market: 'US' | 'ASX' | 'FOREX' | 'CRYPTO';
  av_function: string;
  av_symbol: string;
  av_from_sym: string | null;
  av_to_sym: string | null;
  is_active: boolean;
}

export interface SignalRecord {
  id: string;
  asset_id: string;
  last_price: number | null;
  trend_bias: 'bullish' | 'bearish' | 'neutral' | null;
  kronos_signal: 'Long' | 'Short' | 'Neutral' | null;
  gamma_strength: 'buy_setup' | 'sell_setup' | 'neutral' | null;
  entry_zone_low: number | null;
  entry_zone_high: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  confidence_pct: number | null;
  ema_9: number | null;
  ema_21: number | null;
  ema_200: number | null;
  rsi_14: number | null;
  atr_14: number | null;
  computed_at: string | null;
}

export interface SignalRow extends SignalRecord {
  assets: Pick<AssetRecord, 'ticker' | 'name' | 'asset_class' | 'market'>;
}

export interface SignalResult {
  last_price: number;
  trend_bias: 'bullish' | 'bearish' | 'neutral';
  kronos_signal: 'Long' | 'Short' | 'Neutral';
  gamma_strength: 'buy_setup' | 'sell_setup' | 'neutral';
  entry_zone_low: number | null;
  entry_zone_high: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  confidence_pct: number;
  ema_9: number;
  ema_21: number;
  ema_200: number;
  rsi_14: number;
  atr_14: number;
}

export interface AssetUniverseEntry {
  ticker: string;
  name: string;
  asset_class: 'equity' | 'etf' | 'commodity_fx' | 'crypto';
  market: 'US' | 'ASX' | 'FOREX' | 'CRYPTO';
  av_function: string;
  av_symbol: string;
  av_from_sym?: string;
  av_to_sym?: string;
}
