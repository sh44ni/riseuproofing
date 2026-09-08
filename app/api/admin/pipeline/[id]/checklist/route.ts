import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { SALES_CHART_STAGES, getAutoCompletedKeysForLead } from '@/lib/stage-checklists';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const resolvedParams = await params;
  const leadId = parseInt(resolvedParams.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ ok: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const requestedStage = searchParams.get('stage');

  try {
    // 1. Fetch lead details with joined photo and estimate counts to run auto-completion
    const leadRows = await query<any>(
      `SELECT 
         l.*,
         e.id as estimate_id,
         e.status as estimate_status,
         insp.id as inspection_id,
         j.id as job_id,
         j.status as job_status,
         COALESCE(jp.photo_count, 0) as photo_count,
         w.id as has_warranty_id,
         r.id as has_review_id
       FROM leads l
       LEFT JOIN LATERAL (
         SELECT id, status FROM estimates WHERE lead_id = l.id ORDER BY id DESC LIMIT 1
       ) e ON true
       LEFT JOIN LATERAL (
         SELECT id FROM inspections WHERE lead_id = l.id ORDER BY id DESC LIMIT 1
       ) insp ON true
       LEFT JOIN LATERAL (
         SELECT id, status FROM jobs WHERE lead_id = l.id ORDER BY id DESC LIMIT 1
       ) j ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::INT as photo_count FROM job_photos WHERE (j.id IS NOT NULL AND job_id = j.id) OR lead_id = l.id
       ) jp ON true
       LEFT JOIN LATERAL (
         SELECT id FROM warranties WHERE lead_id = l.id OR (j.id IS NOT NULL AND job_id = j.id) LIMIT 1
       ) w ON true
       LEFT JOIN LATERAL (
         SELECT id FROM reviews WHERE lead_id = l.id OR (j.id IS NOT NULL AND job_id = j.id) LIMIT 1
       ) r ON true
       WHERE l.id = $1`,
      [leadId]
    );

    if (leadRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    const lead = leadRows[0];
    const targetStage = requestedStage || lead.pipeline_stage || 'stage_1_lead_gen';
    const stageConfig = SALES_CHART_STAGES[targetStage] || SALES_CHART_STAGES.stage_1_lead_gen;

    // 2. Fetch persisted checklist items for this lead and stage
    const persisted = await query<any>(
      `SELECT c.*, u.name as completed_by_name
       FROM lead_stage_checklists c
       LEFT JOIN users u ON c.completed_by = u.id
       WHERE c.lead_id = $1 AND c.stage = $2`,
      [leadId, targetStage]
    );

    const persistedMap = new Map<string, any>();
    for (const p of persisted) {
      persistedMap.set(p.item_key, p);
    }

    // 3. Compute auto-completed keys from canonical CRM entities
    const autoKeys = getAutoCompletedKeysForLead(lead);

    // 4. Build enriched checklist
    const items = stageConfig.items.map((item) => {
      const dbRecord = persistedMap.get(item.key);
      const isAuto = autoKeys.has(item.key);

      // If user explicitly marked it or canonical data confirms it
      const completed = dbRecord ? Boolean(dbRecord.completed) : isAuto;

      return {
        key: item.key,
        label: item.label,
        description: item.description,
        isRequired: Boolean(item.isRequired),
        completed,
        isAutoCompleted: isAuto && !dbRecord?.completed_by,
        completedAt: dbRecord?.completed_at || (completed ? lead.created_at : null),
        completedByName: dbRecord?.completed_by_name || (isAuto ? 'Auto Verified' : null),
        notes: dbRecord?.notes || null,
      };
    });

    const completedCount = items.filter((i) => i.completed).length;

    return NextResponse.json({
      ok: true,
      stage: targetStage,
      stageName: stageConfig.stageName,
      items,
      completed_count: completedCount,
      total_count: items.length,
      progress_pct: Math.round((completedCount / items.length) * 100),
    });
  } catch (err) {
    console.error('[checklist GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error fetching stage checklist' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const resolvedParams = await params;
  const leadId = parseInt(resolvedParams.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ ok: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { item_key, completed, stage, notes } = body;

    if (!item_key) {
      return NextResponse.json({ ok: false, error: 'item_key is required' }, { status: 400 });
    }

    // Resolve stage if omitted
    let targetStage = stage;
    if (!targetStage) {
      const l = await query<any>('SELECT pipeline_stage FROM leads WHERE id = $1', [leadId]);
      targetStage = l[0]?.pipeline_stage || 'stage_1_lead_gen';
    }

    const isCompleted = Boolean(completed);

    await query(
      `INSERT INTO lead_stage_checklists (
         lead_id, stage, item_key, completed, completed_by, completed_at, notes, updated_at
       ) VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = true THEN NOW() ELSE NULL END, $6, NOW())
       ON CONFLICT (lead_id, stage, item_key) DO UPDATE
       SET 
         completed = EXCLUDED.completed,
         completed_by = CASE WHEN EXCLUDED.completed = true THEN EXCLUDED.completed_by ELSE NULL END,
         completed_at = CASE WHEN EXCLUDED.completed = true THEN NOW() ELSE NULL END,
         notes = COALESCE(EXCLUDED.notes, lead_stage_checklists.notes),
         updated_at = NOW()`,
      [leadId, targetStage, item_key, isCompleted, auth.user.id, notes || null]
    );

    // Record activity in CRM feed
    const stageConfig = SALES_CHART_STAGES[targetStage];
    const itemDef = stageConfig?.items.find((i) => i.key === item_key);
    const itemLabel = itemDef?.label || item_key;

    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, 'task', $2, $3, $4)`,
      [
        leadId,
        isCompleted ? `Checklist Item Done: ${itemLabel}` : `Checklist Item Reopened: ${itemLabel}`,
        `${auth.user.name} marked "${itemLabel}" as ${isCompleted ? 'completed' : 'incomplete'} for stage: ${stageConfig?.stageName || targetStage}`,
        auth.user.name,
      ]
    );

    return NextResponse.json({
      ok: true,
      item_key,
      completed: isCompleted,
    });
  } catch (err) {
    console.error('[checklist POST]', err);
    return NextResponse.json({ ok: false, error: 'Database error updating checklist item' }, { status: 500 });
  }
}
