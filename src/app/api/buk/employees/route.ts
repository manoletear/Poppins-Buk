import { NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA?.trim() === 'true';

const MOCK_EMPLOYEES = [
  {
    id: 1, nombre: 'María', apellido: 'Martínez García',
    nombreCompleto: 'Martínez García, María', rut: '12.345.678-9',
    cargo: 'Empleada de Casa Particular', fechaIngreso: '01/03/2022',
    estado: 'activo', tipoContrato: 'Indefinido', sueldoBase: 500000,
    afp: 'Provida', salud: 'Fonasa', email: 'mmartinez@gmail.com',
    telefono: '+56 9 1234 5678', direccion: 'Av. Los Leones 432, Providencia',
    iniciales: 'MM', color: '#1B1564', empleador: 'Familia Aravena Riffo',
  },
  {
    id: 2, nombre: 'Ana Lucía', apellido: 'López Silva',
    nombreCompleto: 'López Silva, Ana Lucía', rut: '15.678.901-2',
    cargo: 'Cuidadora de Adulto Mayor', fechaIngreso: '15/06/2023',
    estado: 'activo', tipoContrato: 'Plazo Fijo', sueldoBase: 450000,
    afp: 'Habitat', salud: 'Isapre Masvida', email: 'alopez@gmail.com',
    telefono: '+56 9 2345 6789', direccion: 'Teatinos 890, Santiago',
    iniciales: 'AL', color: '#F0197A', empleador: 'Familia Aravena Riffo',
  },
  {
    id: 3, nombre: 'Carmen', apellido: 'González Rojas',
    nombreCompleto: 'González Rojas, Carmen', rut: '11.222.333-4',
    cargo: 'Nana Puertas Adentro', fechaIngreso: '01/01/2021',
    estado: 'activo', tipoContrato: 'Indefinido', sueldoBase: 520000,
    afp: 'Capital', salud: 'Fonasa', email: 'cgonzalez@gmail.com',
    telefono: '+56 9 3456 7890', direccion: 'Av. Grecia 1201, Ñuñoa',
    iniciales: 'CG', color: '#059669', empleador: 'Familia Aravena Riffo',
  },
  {
    id: 4, nombre: 'Julia', apellido: 'Rodríguez Pérez',
    nombreCompleto: 'Rodríguez Pérez, Julia', rut: '14.555.666-7',
    cargo: 'Asistente de Hogar', fechaIngreso: '10/09/2022',
    estado: 'activo', tipoContrato: 'Indefinido', sueldoBase: 480000,
    afp: 'Planvital', salud: 'Fonasa', email: 'jrodriguez@gmail.com',
    telefono: '+56 9 4567 8901', direccion: "O'Higgins 567, Puente Alto",
    iniciales: 'JR', color: '#7C3AED', empleador: 'Familia Aravena Riffo',
  },
  {
    id: 5, nombre: 'Rosa', apellido: 'Soto Fuentes',
    nombreCompleto: 'Soto Fuentes, Rosa', rut: '16.888.999-0',
    cargo: 'Cocinera', fechaIngreso: '01/11/2023',
    estado: 'activo', tipoContrato: 'Plazo Fijo', sueldoBase: 550000,
    afp: 'Cuprum', salud: 'Isapre Cruz Blanca', email: 'rsoto@gmail.com',
    telefono: '+56 9 5678 9012', direccion: 'Av. Kennedy 4567, Las Condes',
    iniciales: 'RS', color: '#D97706', empleador: 'Familia Aravena Riffo',
  },
];

export async function GET() {
  try {
    if (useMock) {
      return NextResponse.json({ data: MOCK_EMPLOYEES });
    }

    // Non-mock: use service layer
    const { getEmployees } = await import('@/lib/buk');
    const employees = await getEmployees();
    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('[BUK] Error fetching employees:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener colaboradoras' },
      { status: 500 }
    );
  }
}
