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
    .from('family_members')
    .select('*')
    .eq('employee_id', id)
    .order('nombre');

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

  const { nombre, apellido, parentesco, rut, fecha_nacimiento, genero, es_carga_familiar } = body;

  const { data, error } = await supabase
    .from('family_members')
    .insert({
      org_id: ctx.orgId,
      employee_id: id,
      nombre,
      apellido,
      parentesco,
      rut,
      fecha_nacimiento,
      genero,
      es_carga_familiar: es_carga_familiar ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
