import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { PERMISSIONS_CATALOG } from '@/lib/permissions';

export async function GET() {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  // Group catalog by resource
  const grouped: Record<string, typeof PERMISSIONS_CATALOG> = {};
  PERMISSIONS_CATALOG.forEach((p) => {
    if (!grouped[p.resource]) {
      grouped[p.resource] = [];
    }
    grouped[p.resource].push(p);
  });

  return NextResponse.json({
    ok: true,
    catalog: PERMISSIONS_CATALOG,
    grouped,
  });
}
