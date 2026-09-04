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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      <AdminSidebar user={user} />
      <main className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto pt-14 lg:pt-0 pb-24 lg:pb-10">
        {children}
      </main>
      <FAB />
      <BottomNav user={user} />
    </div>
  );
}

