import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('absences')
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const body = await request.json();

  const { employee_id, tipo, fecha_inicio, fecha_fin, dias, observaciones } = body;

  if (!employee_id || !tipo || !fecha_inicio || !fecha_fin || dias == null) {
    return NextResponse.json({ error: 'Campos requeridos: employee_id, tipo, fecha_inicio, fecha_fin, dias' }, { status: 400 });
  }

  // Employees can only create absences for themselves
  if (ctx.role === 'employee' && ctx.employeeId !== employee_id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('absences')
    .insert({
      org_id: ctx.orgId,
      employee_id,
      tipo,
      fecha_inicio,
      fecha_fin,
      dias,
      observaciones: observaciones ?? null,
      estado: 'pendiente',
    })
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
