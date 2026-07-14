import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, nombre, rut, razon_social, email, telefono, direccion, comuna, region, plan, buk_tenant_url, active, created_at')
    .eq('id', ctx.orgId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  // Only allow updating safe fields
  const { nombre, rut, razon_social, email, telefono, direccion, comuna, region } = body;

  const { data, error } = await supabase
    .from('organizations')
    .update({ nombre, rut, razon_social, email, telefono, direccion, comuna, region })
    .eq('id', ctx.orgId)
    .select('id, slug, nombre, rut, razon_social, email, telefono, direccion, comuna, region, plan, buk_tenant_url, active')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 });
  return NextResponse.json({ data });
}
