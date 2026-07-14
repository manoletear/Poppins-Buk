import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/error'];
const ONBOARDING_PATH = '/onboarding';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Not authenticated → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const meta = session.user.app_metadata ?? {};

  // Needs onboarding → redirect to onboarding (unless already there)
  if (meta.needs_onboarding && !pathname.startsWith(ONBOARDING_PATH)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Already onboarded but trying to access onboarding → dashboard
  if (!meta.needs_onboarding && pathname.startsWith(ONBOARDING_PATH)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based route protection
  const role = meta.role ?? 'employee';
  const isEmployee = role === 'employee';
  const isHrOrAbove = ['hr_manager', 'org_admin', 'super_admin'].includes(role);

  // Admin-only routes
  if (pathname.startsWith('/dashboard/usuarios') && isEmployee) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // HR+ routes
  if (pathname.startsWith('/dashboard/reportes') && isEmployee) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Employees can only see their own data in colaboradoras
  if (pathname.startsWith('/dashboard/colaboradoras') && isEmployee) {
    const empId = meta.employee_id;
    if (empId && !pathname.includes(empId)) {
      return NextResponse.redirect(new URL(`/dashboard/colaboradoras/${empId}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
