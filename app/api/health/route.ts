import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();

export async function GET() {
  const { data, error } = await supabase
    .from('signals')
    .select('computed_at, confidence_pct, asset_id, assets(ticker)')
    .order('computed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
