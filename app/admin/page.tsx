import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/admin-auth';

export default async function AdminRoot() {
  const authed = await isAuthenticated();
  if (authed) redirect('/admin/dashboard');
  else redirect('/admin/login');
}
