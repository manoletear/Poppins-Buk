import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { buk_tenant_url, buk_api_token } = await request.json();
  if (!buk_tenant_url || !buk_api_token) {
    return NextResponse.json({ error: 'URL y token son requeridos' }, { status: 400 });
  }

  const baseUrl = buk_tenant_url.replace(/\/$/, '');

  try {
    const res = await fetch(`${baseUrl}/api/v1/chile/employers`, {
      headers: { Authorization: `Token token=${buk_api_token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `BUK respondió ${res.status}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con BUK. Verifica la URL y el token.' }, { status: 400 });
  }
}
