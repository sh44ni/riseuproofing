import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BottomNav from '@/components/admin/layout/BottomNav';
import FAB from '@/components/admin/shared/FAB';
import ConditionalAdminLayout from '@/components/admin/layout/ConditionalAdminLayout';

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

  // ConditionalAdminLayout (Client Component) uses usePathname() to decide
  // whether to show AdminSidebar/BottomNav or the bare dashboard wrapper.
  // Pre-rendered Server Component slots are passed as props.
  return (
    <ConditionalAdminLayout
      sidebar={<AdminSidebar user={user} />}
      bottomNav={<BottomNav user={user} />}
      fab={<FAB />}
    >
      {children}
    </ConditionalAdminLayout>
  );
}
