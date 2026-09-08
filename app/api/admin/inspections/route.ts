import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePermission, requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['inspections:conduct', 'jobs:view', 'leads:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead_id');
  const urgent = searchParams.get('urgent');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (leadId) {
    params.push(parseInt(leadId, 10));
    conditions.push(`i.lead_id = $${params.length}`);
  }

  if (urgent === 'true') {
    conditions.push(`i.urgent_action_required = true`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT i.*, 
            l.full_name as customer_name, l.phone as customer_phone, l.email as customer_email,
            l.address, l.zip, l.service_type,
            j.job_number,
            COALESCE(i.client_id, l.client_id, j.client_id) as client_id
     FROM inspections i
     LEFT JOIN leads l ON i.lead_id = l.id
     LEFT JOIN jobs j ON i.job_id = j.id
     ${where}
     ORDER BY i.inspection_date DESC, i.created_at DESC`,
    params
  );

  // Summary statistics
  const [stats] = await query<{
    total_count: string;
    avg_score: string;
    urgent_count: string;
  }>(`
    SELECT 
      COUNT(*) as total_count,
      ROUND(COALESCE(AVG(roof_health_score), 85)) as avg_score,
      COUNT(CASE WHEN urgent_action_required = true THEN 1 END) as urgent_count
    FROM inspections
  `);

  return NextResponse.json({
    inspections: rows,
    summary: {
      totalCount: parseInt(stats?.total_count || '0', 10),
      avgHealthScore: parseInt(stats?.avg_score || '85', 10),
      urgentCount: parseInt(stats?.urgent_count || '0', 10),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('inspections:conduct');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      leadId,
      jobId,
      inspectorName = 'Michael (Rise Up Lead Inspector)',
      inspectionDate,
      findings = [],
      estimatedRemainingYears = 3,
      notes,
    } = body;

    if (!leadId && !jobId) {
      return NextResponse.json({ error: 'Lead ID or Job ID is required' }, { status: 400 });
    }

    // Auto calculate roof health score (0-100)
    // Start at 100; 'fair' deducts 6 pts; 'critical' deducts 18 pts
    let score = 100;
    let hasUrgent = false;

    for (const item of findings) {
      if (item.status === 'critical') {
        score -= 18;
        hasUrgent = true;
      } else if (item.status === 'fair') {
        score -= 6;
      }
    }
    const finalScore = Math.max(15, Math.min(100, score));

    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inspections`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const inspectionNumber = `INSP-${year}-${seq}`;
    const accessToken = crypto.randomBytes(32).toString('hex');

    const dateStr = inspectionDate || new Date().toISOString().slice(0, 10);

    let resolvedClientId: number | null = null;
    if (leadId) {
      const l = await query<any>('SELECT client_id FROM leads WHERE id = $1', [parseInt(leadId, 10)]);
      if (l[0]?.client_id) resolvedClientId = Number(l[0].client_id);
    }
    if (!resolvedClientId && jobId) {
      const j = await query<any>('SELECT client_id FROM jobs WHERE id = $1', [parseInt(jobId, 10)]);
      if (j[0]?.client_id) resolvedClientId = Number(j[0].client_id);
    }

    const rows = await query<any>(
      `INSERT INTO inspections (
        lead_id, job_id, client_id, inspection_number, inspector_name, inspection_date,
        roof_health_score, findings, urgent_action_required, estimated_remaining_years, notes, access_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        leadId ? parseInt(leadId, 10) : null,
        jobId ? parseInt(jobId, 10) : null,
        resolvedClientId,
        inspectionNumber,
        inspectorName,
        dateStr,
        finalScore,
        JSON.stringify(findings),
        hasUrgent,
        parseInt(estimatedRemainingYears, 10) || 3,
        notes || null,
        accessToken,
      ]
    );

    const createdInspection = rows[0];

    // Update lead status to 'inspected', mark site visit completed, and advance pipeline stage
    if (leadId) {
      await query(
        `UPDATE leads 
         SET status = CASE WHEN status IN ('new', 'contacted') THEN 'inspected' ELSE status END,
             pipeline_stage = CASE WHEN pipeline_stage IN ('stage_1_lead_gen', 'stage_2_initial_contact') THEN 'stage_3_site_visit_estimate' ELSE pipeline_stage END,
             site_visit_completed_at = COALESCE(site_visit_completed_at, NOW()),
             last_contact_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [parseInt(leadId, 10)]
      );

      // Log activity to lead & client timeline
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, $2, 'visit', $3, $4, $5)`,
        [
          parseInt(leadId, 10),
          resolvedClientId,
          `Roof Inspection Completed: Score ${finalScore}/100`,
          `Inspection ${inspectionNumber} performed by ${inspectorName}.${hasUrgent ? ' ⚠️ Critical roof damage identified!' : ''}`,
          inspectorName,
        ]
      );
    }

    return NextResponse.json({ ok: true, inspection: createdInspection });
  } catch (err) {
    console.error('[api/admin/inspections POST]', err);
    return NextResponse.json({ error: 'Server error saving inspection' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('inspections:conduct');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM inspections WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}
