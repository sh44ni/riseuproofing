import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BottomNav from '@/components/admin/layout/BottomNav';
import FAB from '@/components/admin/shared/FAB';

export const metadata = {
  title: 'CRM Admin — Rise Up Roofing & Construction',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const headerList = await headers();
  const pathname =
    headerList.get('x-admin-pathname') ||
    headerList.get('x-invoke-path') ||
    headerList.get('next-url') ||
    '';

  const isLoginPage =
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login');

  if (!user) {
    // Only allow /admin/login through without an authenticated session.
    // Safety: if on login page (or pathname unknown), render login.
    // NEVER redirect to /admin/login when already serving /admin/login.
    if (isLoginPage || pathname === '') {
      return (
        <div className="admin-theme min-h-screen bg-[#F4F8FD] text-[#0B1E33]">
          {children}
        </div>
      );
    }
    redirect('/admin/login');
  }

  // If user is already authenticated and visits /admin/login, forward to dashboard
  if (isLoginPage) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="admin-theme min-h-screen bg-[#F4F8FD] text-[#0B1E33] flex flex-col lg:flex-row">
      <AdminSidebar user={user} />
      <main className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto pt-[74px] lg:pt-8 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-14">
        {children}
      </main>
      <BottomNav user={user} />
      <FAB />
    </div>
  );
}
