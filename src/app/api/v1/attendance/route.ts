import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

function computeHoras(horaEntrada: string, horaSalida: string): number | null {
  // Expect "HH:MM" or "HH:MM:SS"
  const toMinutes = (t: string) => {
    const parts = t.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };
  const start = toMinutes(horaEntrada);
  const end = toMinutes(horaSalida);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employee_id');
  const month = searchParams.get('month'); // YYYY-MM

  let query = supabase
    .from('attendance')
    .select(`*, employee:employees(id, nombre, apellido)`)
    .order('fecha', { ascending: false })
    .order('hora_entrada', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  if (month) {
    // month is YYYY-MM — filter fecha between first and last day of that month
    const [year, mon] = month.split('-').map(Number);
    const firstDay = `${month}-01`;
    const lastDay = new Date(year, mon, 0).toISOString().slice(0, 10); // last day of month
    query = query.gte('fecha', firstDay).lte('fecha', lastDay);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await req.json();

  const {
    employee_id,
    fecha,
    hora_entrada,
    hora_salida,
    tipo,
    estado,
    observaciones,
  } = body;

  if (!employee_id || !fecha) {
    return NextResponse.json(
      { error: 'Campos requeridos: employee_id, fecha' },
      { status: 400 }
    );
  }

  let horas_trabajadas: number | null = null;
  if (hora_entrada && hora_salida) {
    horas_trabajadas = computeHoras(hora_entrada, hora_salida);
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      org_id: ctx.orgId,
      employee_id,
      fecha,
      hora_entrada: hora_entrada ?? null,
      hora_salida: hora_salida ?? null,
      horas_trabajadas,
      tipo: tipo ?? 'normal',
      estado: estado ?? 'presente',
      observaciones: observaciones ?? null,
    })
    .select(`*, employee:employees(id, nombre, apellido)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
