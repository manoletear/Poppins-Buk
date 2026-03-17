import { NextRequest, NextResponse } from 'next/server';
import { getAbsences, createAbsence } from '@/lib/buk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId required' },
        { status: 400 }
      );
    }

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
    const body = await request.json();
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
