import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'super_admin' | 'org_admin' | 'hr_manager' | 'employee';

export interface AuthContext {
  userId: string;
  orgId: string;
  role: UserRole;
  employeeId: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const meta = session.user.app_metadata ?? {};
  if (!meta.org_id || meta.needs_onboarding) return null;

  return {
    userId: session.user.id,
    orgId: meta.org_id,
    role: (meta.role ?? 'employee') as UserRole,
    employeeId: meta.employee_id || null,
    email: session.user.email ?? '',
    fullName: session.user.user_metadata?.full_name ?? session.user.email ?? '',
    avatarUrl: session.user.user_metadata?.avatar_url ?? null,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  return ctx;
}

export async function requireRole(minRole: UserRole): Promise<AuthContext> {
  const ctx = await requireAuth();
  const hierarchy: Record<UserRole, number> = {
    employee: 0,
    hr_manager: 1,
    org_admin: 2,
    super_admin: 3,
  };
  if (hierarchy[ctx.role] < hierarchy[minRole]) redirect('/dashboard');
  return ctx;
}

export function isHrOrAbove(role: UserRole): boolean {
  return ['hr_manager', 'org_admin', 'super_admin'].includes(role);
}

export function isOrgAdmin(role: UserRole): boolean {
  return ['org_admin', 'super_admin'].includes(role);
}
