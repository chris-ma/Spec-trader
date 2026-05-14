-- Widen CHECK constraints to include crypto
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_class_check;
ALTER TABLE assets ADD CONSTRAINT assets_asset_class_check
  CHECK (asset_class IN ('equity','etf','commodity_fx','crypto'));

ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_market_check;
ALTER TABLE assets ADD CONSTRAINT assets_market_check
  CHECK (market IN ('US','ASX','FOREX','CRYPTO'));

-- New ETFs (Stooq .us)
INSERT INTO assets (ticker, name, asset_class, market, av_function, av_symbol) VALUES
  ('VTI',  'Vanguard Total Stock Market ETF',    'etf', 'US', 'STOOQ', 'VTI'),
  ('TLT',  'iShares 20+ Year Treasury Bond ETF', 'etf', 'US', 'STOOQ', 'TLT'),
  ('XLE',  'Energy Select Sector SPDR Fund',     'etf', 'US', 'STOOQ', 'XLE'),
  ('IWM',  'iShares Russell 2000 ETF',           'etf', 'US', 'STOOQ', 'IWM'),
  ('ARKK', 'ARK Innovation ETF',                 'etf', 'US', 'STOOQ', 'ARKK')
ON CONFLICT (ticker) DO NOTHING;

-- Commodity ETFs (Stooq .us)
INSERT INTO assets (ticker, name, asset_class, market, av_function, av_symbol) VALUES
  ('UNG',  'United States Natural Gas Fund',     'etf', 'US', 'STOOQ', 'UNG'),
  ('DBO',  'Invesco DB Oil Fund',                'etf', 'US', 'STOOQ', 'DBO'),
  ('PDBC', 'Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF', 'etf', 'US', 'STOOQ', 'PDBC')
ON CONFLICT (ticker) DO NOTHING;

-- Additional Forex (Stooq .fx)
INSERT INTO assets (ticker, name, asset_class, market, av_function, av_symbol) VALUES
  ('AUDUSD', 'Australian Dollar / US Dollar',  'commodity_fx', 'FOREX', 'STOOQ', 'AUDUSD'),
  ('USDCAD', 'US Dollar / Canadian Dollar',    'commodity_fx', 'FOREX', 'STOOQ', 'USDCAD'),
  ('USDCHF', 'US Dollar / Swiss Franc',        'commodity_fx', 'FOREX', 'STOOQ', 'USDCHF'),
  ('NZDUSD', 'New Zealand Dollar / US Dollar', 'commodity_fx', 'FOREX', 'STOOQ', 'NZDUSD'),
  ('EURJPY', 'Euro / Japanese Yen',            'commodity_fx', 'FOREX', 'STOOQ', 'EURJPY')
ON CONFLICT (ticker) DO NOTHING;

-- Crypto (Binance klines)
INSERT INTO assets (ticker, name, asset_class, market, av_function, av_symbol) VALUES
  ('BTC',  'Bitcoin',   'crypto', 'CRYPTO', 'BINANCE', 'BTCUSDT'),
  ('ETH',  'Ethereum',  'crypto', 'CRYPTO', 'BINANCE', 'ETHUSDT'),
  ('SOL',  'Solana',    'crypto', 'CRYPTO', 'BINANCE', 'SOLUSDT'),
  ('BNB',  'BNB',       'crypto', 'CRYPTO', 'BINANCE', 'BNBUSDT'),
  ('XRP',  'XRP',       'crypto', 'CRYPTO', 'BINANCE', 'XRPUSDT'),
  ('ADA',  'Cardano',   'crypto', 'CRYPTO', 'BINANCE', 'ADAUSDT'),
  ('DOGE', 'Dogecoin',  'crypto', 'CRYPTO', 'BINANCE', 'DOGEUSDT'),
  ('AVAX', 'Avalanche', 'crypto', 'CRYPTO', 'BINANCE', 'AVAXUSDT'),
  ('LTC',  'Litecoin',  'crypto', 'CRYPTO', 'BINANCE', 'LTCUSDT'),
  ('LINK', 'Chainlink', 'crypto', 'CRYPTO', 'BINANCE', 'LINKUSDT')
ON CONFLICT (ticker) DO NOTHING;
