import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('absences')
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Approving or rejecting requires hr_manager+
  if (body.estado === 'aprobada' || body.estado === 'rechazada') {
    if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Sin permisos para aprobar o rechazar' }, { status: 403 });
    }
    body.aprobado_por = ctx.userId;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('absences')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data });
}
