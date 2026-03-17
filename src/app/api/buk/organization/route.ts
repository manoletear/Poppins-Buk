import { NextRequest, NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA?.trim() === 'true';

type OrganizationType = 'departments' | 'cost_centers' | 'roles' | 'companies' | 'locations';

const MOCK_ORG = {
  departments: [
    { id: 1, nombre: 'Dirección', descripcion: 'Área de dirección ejecutiva' },
    { id: 2, nombre: 'Operaciones', descripcion: 'Área de operaciones' },
    { id: 3, nombre: 'Recursos Humanos', descripcion: 'Área de recursos humanos' },
  ],
  cost_centers: [
    { id: 1, nombre: 'Centro de Costo Principal', codigo: 'CCP-001' },
    { id: 2, nombre: 'Centro de Costo Operativo', codigo: 'CCO-001' },
  ],
  roles: [
    { id: 1, nombre: 'Empleada de Casa Particular', descripcion: 'Empleada de hogar' },
    { id: 2, nombre: 'Cuidadora de Adulto Mayor', descripcion: 'Cuidadora especializada' },
    { id: 3, nombre: 'Nana Puertas Adentro', descripcion: 'Nana para cuidado de niños' },
    { id: 4, nombre: 'Asistente de Hogar', descripcion: 'Asistente general' },
    { id: 5, nombre: 'Cocinera', descripcion: 'Especialista en cocina' },
  ],
  companies: [
    { id: 1, nombre: 'Familia Aravena Riffo', rut: '12.345.678-9' },
  ],
  locations: [
    { id: 1, nombre: 'Santiago', ciudad: 'Santiago', region: 'Metropolitana' },
    { id: 2, nombre: 'Providencia', ciudad: 'Providencia', region: 'Metropolitana' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as OrganizationType | null;

    if (!type) {
      return NextResponse.json(
        { error: 'type query parameter required (departments|cost_centers|roles|companies|locations)' },
        { status: 400 }
      );
    }

    if (useMock) {
      const mockData = MOCK_ORG[type as keyof typeof MOCK_ORG];
      if (!mockData) {
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
      }
      return NextResponse.json({ data: mockData });
    }

    const { getBukSDK } = await import('@/lib/buk-sdk');
    const sdk = getBukSDK();
    let data: unknown;

    switch (type) {
      case 'departments':
        data = await sdk.organization.listAllDepartments();
        break;
      case 'cost_centers':
        data = await sdk.organization.listAllCostCenters();
        break;
      case 'roles':
        data = await sdk.organization.listAllRoles();
        break;
      case 'companies':
        data = await sdk.organization.listAllCompanies();
        break;
      case 'locations':
        data = await sdk.organization.listAllLocations();
        break;
      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[BUK] Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de organización' },
      { status: 500 }
    );
  }
}
