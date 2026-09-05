import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('templates:manage');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category && category !== 'all') {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT * FROM templates
     ${where}
     ORDER BY category ASC, name ASC`,
    params
  );

  return NextResponse.json({ templates: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('templates:manage');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { name, category = 'custom', type = 'both', subject, body: templateBody, description } = body;

    if (!name || !templateBody) {
      return NextResponse.json({ error: 'Template name and message body are required' }, { status: 400 });
    }

    const rows = await query<any>(
      `INSERT INTO templates (name, category, type, subject, body, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, type, subject || null, templateBody, description || null]
    );

    return NextResponse.json({ ok: true, template: rows[0] });
  } catch (err) {
    console.error('[api/admin/templates POST]', err);
    return NextResponse.json({ error: 'Server error creating template' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('templates:manage');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, name, category, type, subject, body: templateBody, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (category !== undefined) {
      params.push(category);
      updates.push(`category = $${params.length}`);
    }
    if (type !== undefined) {
      params.push(type);
      updates.push(`type = $${params.length}`);
    }
    if (subject !== undefined) {
      params.push(subject);
      updates.push(`subject = $${params.length}`);
    }
    if (templateBody !== undefined) {
      params.push(templateBody);
      updates.push(`body = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const rows = await query<any>(
      `UPDATE templates SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    return NextResponse.json({ ok: true, template: rows[0] });
  } catch (err) {
    console.error('[api/admin/templates PATCH]', err);
    return NextResponse.json({ error: 'Server error updating template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('templates:manage');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM templates WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}
