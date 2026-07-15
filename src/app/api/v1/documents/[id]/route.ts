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

  const { data: doc, error } = await supabase
    .from('documents')
    .select(`*, employee:employees(id, nombre, apellido, rut)`)
    .eq('id', id)
    .single();

  if (error || !doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Generate a signed download URL valid for 1 hour
  const { data: signedData } = await supabase.storage
    .from('poppins-documents')
    .createSignedUrl(doc.storage_path, 3600);

  return NextResponse.json({
    data: {
      ...doc,
      download_url: signedData?.signedUrl ?? doc.file_url,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['hr_manager', 'org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  // Fetch to get storage_path before deleting
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Delete from storage
  await supabase.storage.from('poppins-documents').remove([doc.storage_path]);

  // Delete from DB
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
