import type { AssetUniverseEntry } from '@/types';

export const ASSET_UNIVERSE: AssetUniverseEntry[] = [
  // US Large Caps
  { ticker: 'AAPL', name: 'Apple Inc.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'AAPL' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'MSFT' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'NVDA' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'AMZN' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'GOOGL' },
  { ticker: 'META', name: 'Meta Platforms Inc.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'META' },
  { ticker: 'TSLA', name: 'Tesla Inc.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'TSLA' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'JPM' },
  { ticker: 'XOM', name: 'Exxon Mobil Corp.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'XOM' },
  { ticker: 'CVX', name: 'Chevron Corp.', asset_class: 'equity', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'CVX' },
  // ASX Blue Chips
  { ticker: 'BHP.AX', name: 'BHP Group Ltd.', asset_class: 'equity', market: 'ASX', av_function: 'TIME_SERIES_DAILY', av_symbol: 'BHP.AX' },
  { ticker: 'CBA.AX', name: 'Commonwealth Bank of Australia', asset_class: 'equity', market: 'ASX', av_function: 'TIME_SERIES_DAILY', av_symbol: 'CBA.AX' },
  { ticker: 'RIO.AX', name: 'Rio Tinto Ltd.', asset_class: 'equity', market: 'ASX', av_function: 'TIME_SERIES_DAILY', av_symbol: 'RIO.AX' },
  { ticker: 'WBC.AX', name: 'Westpac Banking Corp.', asset_class: 'equity', market: 'ASX', av_function: 'TIME_SERIES_DAILY', av_symbol: 'WBC.AX' },
  { ticker: 'ANZ.AX', name: 'ANZ Banking Group Ltd.', asset_class: 'equity', market: 'ASX', av_function: 'TIME_SERIES_DAILY', av_symbol: 'ANZ.AX' },
  // Major ETFs
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', asset_class: 'etf', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'SPY' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', asset_class: 'etf', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'QQQ' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', asset_class: 'etf', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'GLD' },
  { ticker: 'SLV', name: 'iShares Silver Trust', asset_class: 'etf', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'SLV' },
  { ticker: 'USO', name: 'United States Oil Fund', asset_class: 'etf', market: 'US', av_function: 'TIME_SERIES_DAILY', av_symbol: 'USO' },
  // Commodity FX
  { ticker: 'XAUUSD', name: 'Gold / US Dollar', asset_class: 'commodity_fx', market: 'FOREX', av_function: 'FX_DAILY', av_symbol: 'XAUUSD', av_from_sym: 'XAU', av_to_sym: 'USD' },
  { ticker: 'XAGUSD', name: 'Silver / US Dollar', asset_class: 'commodity_fx', market: 'FOREX', av_function: 'FX_DAILY', av_symbol: 'XAGUSD', av_from_sym: 'XAG', av_to_sym: 'USD' },
  { ticker: 'EURUSD', name: 'Euro / US Dollar', asset_class: 'commodity_fx', market: 'FOREX', av_function: 'FX_DAILY', av_symbol: 'EURUSD', av_from_sym: 'EUR', av_to_sym: 'USD' },
  { ticker: 'GBPUSD', name: 'British Pound / US Dollar', asset_class: 'commodity_fx', market: 'FOREX', av_function: 'FX_DAILY', av_symbol: 'GBPUSD', av_from_sym: 'GBP', av_to_sym: 'USD' },
  { ticker: 'USDJPY', name: 'US Dollar / Japanese Yen', asset_class: 'commodity_fx', market: 'FOREX', av_function: 'FX_DAILY', av_symbol: 'USDJPY', av_from_sym: 'USD', av_to_sym: 'JPY' },
];
