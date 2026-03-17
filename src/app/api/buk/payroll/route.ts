import { NextRequest, NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA === 'true';

const MOCK_PAYROLL = [
  {
    id: 1, empleadoId: 1, periodo: 'Marzo 2026',
    sueldoBase: 500000, horasExtra: 25000, bonos: 0, gratificacion: 0,
    totalHaberes: 525000,
    descSalud: 35000, descAfp: 60000, descCesantia: 3150, impuestoUnico: 0, otrosDescuentos: 0,
    totalDescuentos: 98150,
    sueldoBruto: 525000, liquido: 426850,
    estado: 'pagado', fechaPago: '2026-03-05',
  },
  {
    id: 2, empleadoId: 2, periodo: 'Marzo 2026',
    sueldoBase: 450000, horasExtra: 16875, bonos: 0, gratificacion: 0,
    totalHaberes: 466875,
    descSalud: 31500, descAfp: 54000, descCesantia: 2700, impuestoUnico: 0, otrosDescuentos: 0,
    totalDescuentos: 88200,
    sueldoBruto: 466875, liquido: 378675,
    estado: 'pagado', fechaPago: '2026-03-05',
  },
  {
    id: 3, empleadoId: 3, periodo: 'Marzo 2026',
    sueldoBase: 520000, horasExtra: 39000, bonos: 15000, gratificacion: 0,
    totalHaberes: 574000,
    descSalud: 36400, descAfp: 62400, descCesantia: 3120, impuestoUnico: 0, otrosDescuentos: 0,
    totalDescuentos: 101920,
    sueldoBruto: 574000, liquido: 472080,
    estado: 'pagado', fechaPago: '2026-03-05',
  },
  {
    id: 4, empleadoId: 4, periodo: 'Marzo 2026',
    sueldoBase: 480000, horasExtra: 0, bonos: 0, gratificacion: 0,
    totalHaberes: 480000,
    descSalud: 33600, descAfp: 57600, descCesantia: 2880, impuestoUnico: 0, otrosDescuentos: 0,
    totalDescuentos: 94080,
    sueldoBruto: 480000, liquido: 385920,
    estado: 'pendiente', fechaPago: null,
  },
  {
    id: 5, empleadoId: 5, periodo: 'Marzo 2026',
    sueldoBase: 550000, horasExtra: 0, bonos: 20000, gratificacion: 43750,
    totalHaberes: 613750,
    descSalud: 38500, descAfp: 66000, descCesantia: 3300, impuestoUnico: 12000, otrosDescuentos: 0,
    totalDescuentos: 119800,
    sueldoBruto: 613750, liquido: 493950,
    estado: 'pendiente', fechaPago: null,
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
