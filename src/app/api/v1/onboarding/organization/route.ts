import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { nombre, rut, razon_social, email, telefono, direccion, comuna, region } = body;

  if (!nombre || !rut) {
    return NextResponse.json({ error: 'Nombre y RUT son requeridos' }, { status: 400 });
  }

  const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const service = createServiceClient();

  // Create organization
  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ nombre, rut, razon_social, email, telefono, direccion, comuna, region, slug })
    .select('id')
    .single();

  if (orgError) {
    console.error('org insert error:', orgError);
    return NextResponse.json({ error: 'Error al crear la organización' }, { status: 500 });
  }

  // Create user record linking auth.users → organizations
  const { error: userError } = await service
    .from('users')
    .insert({
      id: session.user.id,
      org_id: org.id,
      role: 'org_admin',
      full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
      email: session.user.email ?? '',
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
    });

  if (userError) {
    console.error('user insert error:', userError);
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }

  // Refresh session so JWT picks up new org_id from hook
  await supabase.auth.refreshSession();

  return NextResponse.json({ success: true, orgId: org.id });
}
