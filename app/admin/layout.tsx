import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BottomNav from '@/components/admin/layout/BottomNav';
import FAB from '@/components/admin/shared/FAB';

export const metadata = { title: 'CRM Admin — Rise Up Roofing & Construction' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const headerList = await headers();
  const pathname = headerList.get('x-admin-pathname') || '';

  if (!user) {
    // Only allow /admin/login through without an authenticated session
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      return (
        <div className="admin-theme min-h-screen bg-[#0c1117] text-[#f0f2f5]">
          {children}
        </div>
      );
    }
    redirect('/admin/login');
  }

  return (
    <div className="admin-theme min-h-screen bg-[#0c1117] text-[#f0f2f5] flex flex-col lg:flex-row">
      <AdminSidebar user={user} />
      <main className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto pt-[52px] lg:pt-0 pb-24 lg:pb-10">
        {children}
      </main>
      <BottomNav user={user} />
      <FAB />
    </div>
  );
}
