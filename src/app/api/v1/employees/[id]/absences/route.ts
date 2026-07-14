import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('employee_id', id)
    .order('fecha_inicio', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { tipo, fecha_inicio, fecha_fin, dias, observaciones } = body;

  const { data, error } = await supabase
    .from('absences')
    .insert({
      org_id: ctx.orgId,
      employee_id: id,
      tipo,
      fecha_inicio,
      fecha_fin,
      dias,
      observaciones,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
