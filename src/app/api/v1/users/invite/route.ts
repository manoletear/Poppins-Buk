import { createServiceClient } from '@/lib/supabase/service';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Solo administradores pueden invitar usuarios' }, { status: 403 });
  }

  const { email, role, full_name } = await request.json();
  if (!email || !role) {
    return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 });
  }

  const validRoles = ['hr_manager', 'employee'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido. Usar: hr_manager o employee' }, { status: 400 });
  }

  const service = createServiceClient();

  // Invite user via Supabase Admin Auth
  const { data: authData, error: authError } = await service.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: full_name ?? email,
      org_id: ctx.orgId,
      role,
      needs_onboarding: false,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Pre-create the user record in our users table
  await service.from('users').upsert(
    {
      id: authData.user.id,
      org_id: ctx.orgId,
      role,
      full_name: full_name ?? email,
      email,
      active: false,
    },
    { onConflict: 'id' },
  );

  return NextResponse.json({ success: true, message: `Invitación enviada a ${email}` });
}
