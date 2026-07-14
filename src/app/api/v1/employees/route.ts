import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, rut, nombre, apellido, email, telefono, direccion,
      fecha_ingreso, estado, puertas_adentro, foto_url,
      job_position:job_positions(id, nombre),
      department:departments(id, nombre),
      contracts(id, tipo_contrato, sueldo_base, afp_nombre, salud_tipo, salud_nombre, activo)
    `)
    .order('apellido');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pluck active contract per employee
  const enriched = (data ?? []).map(emp => ({
    ...emp,
    contract: (emp.contracts as any[])?.find(c => c.activo) ?? null,
    contracts: undefined,
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { employee: employeeData, contract: contractData } = body;

  if (!employeeData) {
    return NextResponse.json({ error: 'Datos de empleado requeridos' }, { status: 400 });
  }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .insert({ ...employeeData, org_id: ctx.orgId })
    .select()
    .single();

  if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });

  if (contractData && employee) {
    const { error: contractError } = await supabase
      .from('contracts')
      .insert({ ...contractData, org_id: ctx.orgId, employee_id: employee.id, activo: true });

    if (contractError) {
      return NextResponse.json({ error: contractError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: employee }, { status: 201 });
}
