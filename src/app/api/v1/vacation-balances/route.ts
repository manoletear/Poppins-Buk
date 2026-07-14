import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vacation_balances')
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
