DELETE FROM signals WHERE asset_id IN (SELECT id FROM assets WHERE asset_class = 'equity' AND market = 'US');
DELETE FROM market_data WHERE asset_id IN (SELECT id FROM assets WHERE asset_class = 'equity' AND market = 'US');
DELETE FROM assets WHERE asset_class = 'equity' AND market = 'US';
