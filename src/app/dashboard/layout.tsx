import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const meta = session.user.app_metadata ?? {};
  if (meta.needs_onboarding) redirect('/onboarding');

  const fullName = session.user.user_metadata?.full_name ?? session.user.email ?? '';
  const avatarUrl = session.user.user_metadata?.avatar_url ?? null;
  const email = session.user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2F5]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar fullName={fullName} avatarUrl={avatarUrl} email={email} />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
