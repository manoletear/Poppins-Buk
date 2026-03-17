import { NextRequest, NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA?.trim() === 'true';

const MOCK_OVERTIME = [
  {
    id: 1, empleadoId: 1, empleadoNombre: 'María Martínez García',
    fecha: '2024-03-08', horasExtras: 2, tarifa: 12500, total: 25000,
    observaciones: 'Trabajo adicional por limpieza profunda',
  },
  {
    id: 2, empleadoId: 2, empleadoNombre: 'Ana Lucía López Silva',
    fecha: '2024-03-10', horasExtras: 1.5, tarifa: 11250, total: 16875,
    observaciones: 'Cuidado nocturno adicional',
  },
  {
    id: 3, empleadoId: 3, empleadoNombre: 'Carmen González Rojas',
    fecha: '2024-03-05', horasExtras: 3, tarifa: 13000, total: 39000,
    observaciones: 'Preparación de evento familiar',
  },
  {
    id: 4, empleadoId: 4, empleadoNombre: 'Julia Rodríguez Pérez',
    fecha: '2024-03-12', horasExtras: 2.5, tarifa: 12000, total: 30000,
    observaciones: 'Apoyo con tareas domésticas especiales',
  },
];

export async function GET(request: NextRequest) {
  try {
    if (useMock) {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employeeId');

      let filtered = MOCK_OVERTIME;
      if (employeeId) {
        filtered = filtered.filter(o => o.empleadoId === Number(employeeId));
      }

      return NextResponse.json({ data: filtered });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { getOvertime } = await import('@/lib/buk');
    const overtime = await getOvertime(
      employeeId ? Number(employeeId) : undefined,
      startDate || undefined,
      endDate || undefined
    );
    return NextResponse.json({ data: overtime });
  } catch (error) {
    console.error('[BUK] Error fetching overtime:', error);
    return NextResponse.json(
      { error: 'Error al obtener horas extras' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (useMock) {
      const body = await request.json();
      return NextResponse.json(
        { data: { success: true, id: Date.now() } },
        { status: 201 }
      );
    }

    const body = await request.json();
    const { createOvertime } = await import('@/lib/buk');
    const result = await createOvertime(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('[BUK] Error creating overtime:', error);
    return NextResponse.json(
      { error: 'Error al crear registro de horas extras' },
      { status: 500 }
    );
  }
}
