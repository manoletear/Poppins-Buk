import { NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA === 'true';

const MOCK_BENEFITS = [
  {
    id: 1, nombre: 'Seguro de Vida', descripcion: 'Cobertura de vida para colaboradores',
    monto: 1000000, estado: 'activo', tipo: 'seguro',
  },
  {
    id: 2, nombre: 'Fondo de Ahorro', descripcion: 'Programa de ahorro voluntario',
    monto: 50000, estado: 'activo', tipo: 'ahorro',
  },
  {
    id: 3, nombre: 'Bonificación Anual', descripcion: 'Bonificación por desempeño',
    monto: 250000, estado: 'activo', tipo: 'bonificacion',
  },
  {
    id: 4, nombre: 'Capacitación', descripcion: 'Acceso a cursos y talleres',
    monto: 0, estado: 'activo', tipo: 'beneficio',
  },
];

export async function GET() {
  try {
    if (useMock) {
      return NextResponse.json({ data: MOCK_BENEFITS });
    }

    const { getBenefits } = await import('@/lib/buk');
    const benefits = await getBenefits();
    return NextResponse.json({ data: benefits });
  } catch (error) {
    console.error('[BUK] Error fetching benefits:', error);
    return NextResponse.json(
      { error: 'Error al obtener beneficios' },
      { status: 500 }
    );
  }
}
