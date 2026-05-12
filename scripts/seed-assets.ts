import { createClient } from '@supabase/supabase-js';
import { ASSET_UNIVERSE } from '../lib/signals/universe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const rows = ASSET_UNIVERSE.map((a) => ({
    ticker: a.ticker,
    name: a.name,
    asset_class: a.asset_class,
    market: a.market,
    av_function: a.av_function,
    av_symbol: a.av_symbol,
    av_from_sym: a.av_from_sym ?? null,
    av_to_sym: a.av_to_sym ?? null,
    is_active: true,
  }));

  const { error } = await db.from('assets').upsert(rows, { onConflict: 'ticker' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} assets.`);
}

main();
