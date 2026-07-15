import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { employee_id, tipo, filename, mime_type, file_size } = await request.json();

  if (!employee_id || !tipo || !filename) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Sanitize filename: remove special chars, keep extension
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin';
  const safe = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const storagePath = `${ctx.orgId}/${employee_id}/${tipo}/${Date.now()}_${safe}.${ext}`;

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('poppins-documents')
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Error generando URL' }, { status: 500 });
  }

  return NextResponse.json({
    upload_url: data.signedUrl,
    token: data.token,
    storage_path: storagePath,
  });
}
