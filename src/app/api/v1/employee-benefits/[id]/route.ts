import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const JOINS = `
  *,
  employee:employees(id, nombre, apellido),
  benefit:benefits(id, nombre, tipo, monto)
`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employee_benefits')
    .select(JOINS)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { monto_override, fecha_fin, activo, notas } = body;

  const updatePayload: Record<string, unknown> = {};
  if (monto_override !== undefined) updatePayload.monto_override = monto_override != null ? Number(monto_override) : null;
  if (fecha_fin !== undefined) updatePayload.fecha_fin = fecha_fin;
  if (activo !== undefined) updatePayload.activo = activo;
  if (notas !== undefined) updatePayload.notas = notas;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employee_benefits')
    .update(updatePayload)
    .eq('id', id)
    .select(JOINS)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('employee_benefits')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
