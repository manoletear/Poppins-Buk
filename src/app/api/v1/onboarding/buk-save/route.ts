import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const orgId = session.user.app_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: 'Sin organización asignada' }, { status: 403 });

  const { buk_tenant_url, buk_api_token } = await request.json();

  if (!buk_tenant_url && !buk_api_token) {
    return NextResponse.json({ success: true });
  }

  const service = createServiceClient();

  const { error } = await service
    .from('organizations')
    .update({
      buk_tenant_url: buk_tenant_url || null,
      // NOTE: In production, encrypt buk_api_token with ENCRYPTION_KEY before storing
      buk_api_token_encrypted: buk_api_token || null,
    })
    .eq('id', orgId);

  if (error) {
    return NextResponse.json({ error: 'Error al guardar configuración BUK' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
