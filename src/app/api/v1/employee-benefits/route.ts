import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employee_id');
  const benefitId = searchParams.get('benefit_id');

  const supabase = await createClient();

  let query = supabase
    .from('employee_benefits')
    .select(`
      *,
      employee:employees(id, nombre, apellido),
      benefit:benefits(id, nombre, tipo, monto)
    `)
    .order('created_at', { ascending: false });

  if (employeeId) query = query.eq('employee_id', employeeId);
  if (benefitId) query = query.eq('benefit_id', benefitId);

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
  const { employee_id, benefit_id, monto_override, fecha_inicio, fecha_fin, notas } = body;

  if (!employee_id || !benefit_id) {
    return NextResponse.json(
      { error: 'Campos requeridos: employee_id, benefit_id' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('employee_benefits')
    .insert({
      org_id: ctx.orgId,
      employee_id,
      benefit_id,
      monto_override: monto_override != null ? Number(monto_override) : null,
      fecha_inicio: fecha_inicio ?? new Date().toISOString().slice(0, 10),
      fecha_fin: fecha_fin ?? null,
      notas: notas ?? null,
      activo: true,
    })
    .select(`
      *,
      employee:employees(id, nombre, apellido),
      benefit:benefits(id, nombre, tipo, monto)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
