import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('department_id');

  let query = supabase
    .from('job_positions')
    .select('*')
    .eq('org_id', ctx.orgId)
    .order('nombre');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('job_positions')
    .insert({ ...body, org_id: ctx.orgId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
