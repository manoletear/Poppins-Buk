import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('benefits')
    .select('*')
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
  const { nombre, descripcion, monto, tipo, categoria, activo } = body;

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (nombre !== undefined) updatePayload.nombre = nombre;
  if (descripcion !== undefined) updatePayload.descripcion = descripcion;
  if (monto !== undefined) updatePayload.monto = Number(monto);
  if (tipo !== undefined) updatePayload.tipo = tipo;
  if (categoria !== undefined) updatePayload.categoria = categoria;
  if (activo !== undefined) updatePayload.activo = activo;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('benefits')
    .update(updatePayload)
    .eq('id', id)
    .select()
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

  // Guard: reject deletion if any employee_benefits reference this benefit
  const { count, error: countError } = await supabase
    .from('employee_benefits')
    .select('id', { count: 'exact', head: true })
    .eq('benefit_id', id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Beneficio asignado a colaboradoras, desactivar en lugar de eliminar' },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from('benefits')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
