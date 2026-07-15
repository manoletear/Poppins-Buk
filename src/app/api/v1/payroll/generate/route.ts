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
    periodo,
    bonos_global = 0,
    colacion_global = 0,
    movilizacion_global = 0,
  } = await request.json();

  if (!periodo) {
    return NextResponse.json({ error: 'periodo es requerido (formato YYYY-MM)' }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. Get all active employees for this org
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, nombre, apellido')
    .eq('org_id', ctx.orgId)
    .eq('estado', 'activo');

  if (empError) {
    return NextResponse.json({ error: empError.message }, { status: 500 });
  }

  if (!employees || employees.length === 0) {
    return NextResponse.json({ data: { created: 0, updated: 0, errors: [] } });
  }

  // Build period date range
  const periodStart = periodo + '-01';
  const periodEnd = new Date(
    parseInt(periodo.slice(0, 4)),
    parseInt(periodo.slice(5, 7)),
    0,
  ).toISOString().slice(0, 10);

  // 2. Process all employees in parallel
  const results = await Promise.all(
    employees.map(async (employee) => {
      try {
        // Get active contract
        const { data: contract } = await supabase
          .from('contracts')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('activo', true)
          .single();

        if (!contract) {
          return {
            employee_id: employee.id,
            skipped: true,
            reason: 'Sin contrato activo',
          };
        }

        // Get approved overtime for the period
        const { data: overtime } = await supabase
          .from('overtime_requests')
          .select('horas, tipo, monto')
          .eq('employee_id', employee.id)
          .eq('estado', 'aprobada')
          .gte('fecha', periodStart)
          .lte('fecha', periodEnd);

        // Calculate payroll
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
          bonos: bonos_global,
          colacion: colacion_global,
          movilizacion: movilizacion_global,
          otros_haberes: 0,
          otros_descuentos: 0,
          uf_value: 38500,
        });

        // Upsert into payroll table
        const { error: upsertError } = await supabase
          .from('payroll')
          .upsert(
            {
              org_id: ctx.orgId,
              employee_id: employee.id,
              periodo,
              sueldo_base: result.sueldo_base,
              gratificacion: result.gratificacion,
              monto_horas_extra: result.monto_horas_extra,
              bonos: result.bonos,
              colacion: result.colacion,
              movilizacion: result.movilizacion,
              otros_haberes: result.otros_haberes,
              total_haberes: result.total_haberes,
              desc_afp: result.desc_afp,
              desc_salud: result.desc_salud,
              desc_cesantia: result.desc_cesantia,
              impuesto_unico: result.impuesto_unico,
              otros_descuentos: result.otros_descuentos,
              total_descuentos: result.total_descuentos,
              sueldo_liquido: result.sueldo_liquido,
              estado: 'borrador',
            },
            { onConflict: 'employee_id,periodo' },
          );

        if (upsertError) {
          return {
            employee_id: employee.id,
            error: upsertError.message,
          };
        }

        return { employee_id: employee.id, success: true };
      } catch (err) {
        return {
          employee_id: employee.id,
          error: err instanceof Error ? err.message : 'Error desconocido',
        };
      }
    }),
  );

  // 3. Summarize results
  const successful = results.filter(r => 'success' in r && r.success);
  const skipped = results.filter(r => 'skipped' in r && r.skipped);
  const errors = results.filter(r => 'error' in r);

  return NextResponse.json({
    data: {
      total: employees.length,
      created: successful.length,
      skipped: skipped.length,
      errors: errors.map(e => ({
        employee_id: e.employee_id,
        message: 'error' in e ? e.error : 'reason' in e ? e.reason : 'Error desconocido',
      })),
    },
  });
}
