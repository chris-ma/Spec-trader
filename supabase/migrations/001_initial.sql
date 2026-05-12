-- Asset universe
CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker      TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('equity','etf','commodity_fx')),
  market      TEXT NOT NULL CHECK (market IN ('US','ASX','FOREX')),
  av_function TEXT NOT NULL,
  av_symbol   TEXT NOT NULL,
  av_from_sym TEXT,
  av_to_sym   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Daily + intraday OHLCV cache
CREATE TABLE market_data (
  id           BIGSERIAL PRIMARY KEY,
  asset_id     UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  bar_interval TEXT NOT NULL DEFAULT 'daily',
  bar_date     DATE NOT NULL,
  bar_time     TIMESTAMPTZ,
  open         NUMERIC(18,6) NOT NULL,
  high         NUMERIC(18,6) NOT NULL,
  low          NUMERIC(18,6) NOT NULL,
  close        NUMERIC(18,6) NOT NULL,
  volume       BIGINT,
  fetched_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (asset_id, bar_interval, bar_date, bar_time)
);

CREATE INDEX idx_md_asset_interval_date ON market_data(asset_id, bar_interval, bar_date DESC);

-- Computed signals (one row per asset)
CREATE TABLE signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE UNIQUE,
  last_price      NUMERIC(18,6),
  trend_bias      TEXT CHECK (trend_bias IN ('bullish','bearish','neutral')),
  kronos_signal   TEXT CHECK (kronos_signal IN ('Long','Short','Neutral')),
  gamma_strength  TEXT CHECK (gamma_strength IN ('buy_setup','sell_setup','neutral')),
  entry_zone_low  NUMERIC(18,6),
  entry_zone_high NUMERIC(18,6),
  stop_loss       NUMERIC(18,6),
  target_1        NUMERIC(18,6),
  target_2        NUMERIC(18,6),
  confidence_pct  SMALLINT CHECK (confidence_pct BETWEEN 0 AND 100),
  ema_9           NUMERIC(18,6),
  ema_21          NUMERIC(18,6),
  ema_200         NUMERIC(18,6),
  rsi_14          NUMERIC(6,3),
  atr_14          NUMERIC(18,6),
  computed_at     TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read assets"
  ON assets FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read signals"
  ON signals FOR SELECT TO anon, authenticated USING (true);
