import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { calcularPayroll } from '@/lib/payroll/calculator';

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const {
    employee_id,
    periodo,
    bonos = 0,
    colacion = 0,
    movilizacion = 0,
    otros_haberes = 0,
    otros_descuentos = 0,
  } = await request.json();

  if (!employee_id || !periodo) {
    return NextResponse.json({ error: 'employee_id y periodo son requeridos' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get active contract
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('employee_id', employee_id)
    .eq('activo', true)
    .single();

  if (!contract) {
    return NextResponse.json({ error: 'No hay contrato activo para esta empleada' }, { status: 400 });
  }

  // Get approved overtime for this period
  const periodStart = periodo + '-01';
  const periodEnd = new Date(
    parseInt(periodo.slice(0, 4)),
    parseInt(periodo.slice(5, 7)),
    0,
  ).toISOString().slice(0, 10);

  const { data: overtime } = await supabase
    .from('overtime_requests')
    .select('horas, tipo, monto')
    .eq('employee_id', employee_id)
    .eq('estado', 'aprobada')
    .gte('fecha', periodStart)
    .lte('fecha', periodEnd);

  const result = calcularPayroll({
    sueldo_base: contract.sueldo_base,
    gratificacion_tipo: contract.gratificacion_tipo ?? 'proporcional',
    afp_tasa: contract.afp_tasa,
    salud_tipo: contract.salud_tipo,
    plan_salud_uf: contract.plan_salud_uf,
    overtime_aprobado: (overtime ?? []).map(ot => ({
      horas: ot.horas,
      tipo: ot.tipo as '50%' | '100%' | 'otro',
      monto: ot.monto,
    })),
    bonos,
    colacion,
    movilizacion,
    otros_haberes,
    otros_descuentos,
    uf_value: 38500,
  });

  return NextResponse.json({
    data: {
      ...result,
      employee_id,
      periodo,
      contract_id: contract.id,
      dias_trabajados: 30,
    },
  });
}
