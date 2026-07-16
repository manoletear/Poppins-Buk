import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('benefits')
    .select('*')
    .order('categoria', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { nombre, descripcion, monto, tipo, categoria, activo } = body;

  if (!nombre || monto == null || !tipo) {
    return NextResponse.json({ error: 'Campos requeridos: nombre, monto, tipo' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('benefits')
    .insert({
      org_id: ctx.orgId,
      nombre,
      descripcion: descripcion ?? null,
      monto: Number(monto),
      tipo,
      categoria: categoria ?? null,
      activo: activo !== undefined ? activo : true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
