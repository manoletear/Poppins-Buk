import { NextRequest, NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA === 'true';

const MOCK_PAYROLL = [
  {
    id: 1, empleadoId: 1, empleadoNombre: 'María Martínez García',
    periodo: 'Marzo 2024', sueldoBase: 500000,
    gratificacion: 0, descAfp: 60000, descSalud: 35000,
    descCesantia: 50000, impuestoUnico: 0, liquido: 355000,
  },
  {
    id: 2, empleadoId: 3, empleadoNombre: 'Carmen González Rojas',
    periodo: 'Marzo 2024', sueldoBase: 520000,
    gratificacion: 0, descAfp: 62400, descSalud: 36400,
    descCesantia: 52000, impuestoUnico: 0, liquido: 369200,
  },
  {
    id: 3, empleadoId: 5, empleadoNombre: 'Rosa Soto Fuentes',
    periodo: 'Marzo 2024', sueldoBase: 550000,
    gratificacion: 43750, descAfp: 66000, descSalud: 38500,
    descCesantia: 55000, impuestoUnico: 12000, liquido: 422250,
  },
];

export async function GET(request: NextRequest) {
  try {
    if (useMock) {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employeeId');

      if (employeeId) {
        const items = MOCK_PAYROLL.filter(p => p.empleadoId === Number(employeeId));
        return NextResponse.json({ data: items });
      }

      return NextResponse.json({ data: MOCK_PAYROLL });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const { getPayrollItems } = await import('@/lib/buk');
    const items = await getPayrollItems(employeeId ? Number(employeeId) : undefined);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('[BUK] Error fetching payroll:', error);
    return NextResponse.json(
      { error: 'Error al obtener liquidaciones' },
      { status: 500 }
    );
  }
}
