import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = { title: 'Admin — Rise Up Roofing' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if this is the login page by reading the children structure.
  // We'll let the middleware-style check happen inside each protected page,
  // but show the sidebar shell only for authenticated users.
  const authed = await isAuthenticated();

  if (!authed) {
    // Allow login page to render without sidebar
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar />
      <main className="flex-1 min-h-screen overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
