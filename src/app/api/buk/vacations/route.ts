import { NextRequest, NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA?.trim() === 'true';

const MOCK_ABSENCES = [
  {
    id: 1, empleadoId: 1, empleadoNombre: 'María Martínez García',
    tipo: 'vacaciones', fechaInicio: '2024-03-15', fechaFin: '2024-03-29',
    diasSolicitados: 15, estado: 'aprobado', observaciones: 'Vacaciones de verano',
  },
  {
    id: 2, empleadoId: 2, empleadoNombre: 'Ana Lucía López Silva',
    tipo: 'licencia_medica', fechaInicio: '2024-02-20', fechaFin: '2024-02-27',
    diasSolicitados: 7, estado: 'aprobado', observaciones: 'Licencia médica por gripe',
  },
  {
    id: 3, empleadoId: 3, empleadoNombre: 'Carmen González Rojas',
    tipo: 'permiso', fechaInicio: '2024-03-08', fechaFin: '2024-03-08',
    diasSolicitados: 1, estado: 'aprobado', observaciones: 'Permiso personal',
  },
  {
    id: 4, empleadoId: 4, empleadoNombre: 'Julia Rodríguez Pérez',
    tipo: 'vacaciones', fechaInicio: '2024-01-15', fechaFin: '2024-01-26',
    diasSolicitados: 10, estado: 'aprobado', observaciones: 'Vacaciones pactadas',
  },
  {
    id: 5, empleadoId: 5, empleadoNombre: 'Rosa Soto Fuentes',
    tipo: 'licencia_medica', fechaInicio: '2024-02-10', fechaFin: '2024-02-12',
    diasSolicitados: 3, estado: 'pendiente', observaciones: 'Licencia por tensión alta',
  },
];

export async function GET(request: NextRequest) {
  try {
    if (useMock) {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employeeId');

      if (employeeId) {
        const absences = MOCK_ABSENCES.filter(a => a.empleadoId === Number(employeeId));
        return NextResponse.json({ data: absences });
      }

      return NextResponse.json({ data: MOCK_ABSENCES });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId required' },
        { status: 400 }
      );
    }

    const { getAbsences } = await import('@/lib/buk');
    const vacations = await getAbsences(Number(employeeId));
    return NextResponse.json({ data: vacations });
  } catch (error) {
    console.error('[BUK] Error fetching vacations:', error);
    return NextResponse.json(
      { error: 'Error al obtener vacaciones' },
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
    const { createAbsence } = await import('@/lib/buk');
    const result = await createAbsence(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('[BUK] Error creating vacation:', error);
    return NextResponse.json(
      { error: 'Error al crear solicitud de vacación' },
      { status: 500 }
    );
  }
}
