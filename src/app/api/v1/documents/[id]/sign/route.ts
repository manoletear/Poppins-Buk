import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .update({
      firmado: true,
      fecha_firma: new Date().toISOString(),
      firmado_por_id: ctx.userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 });
  return NextResponse.json({ data });
}
