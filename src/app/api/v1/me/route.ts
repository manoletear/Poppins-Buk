import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, org_id, role, full_name, avatar_url, email, active, last_login_at, created_at')
    .eq('id', ctx.userId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  return NextResponse.json({ data: { ...data, orgId: ctx.orgId } });
}
