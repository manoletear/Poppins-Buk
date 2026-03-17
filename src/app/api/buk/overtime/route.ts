import { NextRequest, NextResponse } from 'next/server';
import { getOvertime, createOvertime } from '@/lib/buk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
    const body = await request.json();
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
