import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function computeHoras(horaEntrada: string, horaSalida: string): number | null {
  const toMinutes = (t: string) => {
    const parts = t.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };
  const start = toMinutes(horaEntrada);
  const end = toMinutes(horaSalida);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attendance')
    .select(`*, employee:employees(id, nombre, apellido)`)
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
  const supabase = await createClient();

  // Fetch the current record so we can recompute horas_trabajadas if needed
  const { data: existing, error: fetchErr } = await supabase
    .from('attendance')
    .select('hora_entrada, hora_salida')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const horaEntrada = body.hora_entrada ?? existing.hora_entrada;
  const horaSalida = body.hora_salida ?? existing.hora_salida;

  let horas_trabajadas: number | null | undefined = undefined;
  if (horaEntrada && horaSalida) {
    horas_trabajadas = computeHoras(horaEntrada, horaSalida);
  } else if (body.hora_salida === null || body.hora_entrada === null) {
    horas_trabajadas = null;
  }

  // Strip internal fields that callers shouldn't set directly
  const { org_id: _org, id: _id, created_at: _ca, ...safeBody } = body;

  const updatePayload: Record<string, unknown> = {
    ...safeBody,
    updated_at: new Date().toISOString(),
  };

  if (horas_trabajadas !== undefined) {
    updatePayload.horas_trabajadas = horas_trabajadas;
  }

  const { data, error } = await supabase
    .from('attendance')
    .update(updatePayload)
    .eq('id', id)
    .select(`*, employee:employees(id, nombre, apellido)`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'No encontrado' }, { status: 500 });
  }

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
    .from('attendance')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
