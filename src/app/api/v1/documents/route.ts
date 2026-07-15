import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      employee:employees(id, nombre, apellido, rut)
    `)
    .order('created_at', { ascending: false });

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
  const { employee_id, tipo, nombre, storage_path, file_size, mime_type, periodo } = body;

  // Get public URL for the stored file
  const { data: urlData } = supabase.storage
    .from('poppins-documents')
    .getPublicUrl(storage_path);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      org_id: ctx.orgId,
      employee_id,
      tipo,
      nombre,
      storage_path,
      file_url: urlData?.publicUrl ?? null,
      file_size: file_size ?? null,
      mime_type: mime_type ?? null,
      periodo: periodo ?? null,
      firmado: false,
      subido_por_id: ctx.userId,
    })
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Error creando documento' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
