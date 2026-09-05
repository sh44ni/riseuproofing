import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  type: 'job' | 'delivery' | 'city_inspection' | 'task' | 'warranty' | 'inspection';
  status?: string;
  customer?: string;
  address?: string;
  crewLead?: string;
  contractValue?: number;
  link?: string;
}

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'jobs:view']);
  if (auth.response) return auth.response;

  try {
    const [jobs, tasks, warranties, inspections] = await Promise.all([
      query<any>(`
        SELECT id, job_number, status, customer_name, address, city, scheduled_start, estimated_days,
               material_delivered_at, material_status, permit_approved_at, permit_status, crew_lead, contract_value
        FROM jobs
        WHERE scheduled_start IS NOT NULL OR material_delivered_at IS NOT NULL OR permit_approved_at IS NOT NULL
        ORDER BY scheduled_start ASC
      `),
      query<any>(`
        SELECT id, title, due_at, completed_at, priority, assigned_to
        FROM tasks
        WHERE due_at IS NOT NULL AND completed_at IS NULL
        ORDER BY due_at ASC
        LIMIT 50
      `),
      query<any>(`
        SELECT w.id, w.warranty_number, w.checkin_6mo_due, w.checkin_1yr_due, 
               w.checkin_6mo_completed, w.checkin_1yr_completed,
               j.customer_name, j.address, j.city
        FROM warranties w
        LEFT JOIN jobs j ON w.job_id = j.id
        WHERE w.status = 'active'
      `),
      query<any>(`
        SELECT i.id, i.inspection_number, i.inspection_date, i.inspector_name, i.roof_health_score,
               l.full_name as customer_name, l.address, l.city
        FROM inspections i
        LEFT JOIN leads l ON i.lead_id = l.id
        ORDER BY i.inspection_date DESC
        LIMIT 30
      `),
    ]);

    const events: CalendarEvent[] = [];

    // 1. Job Events & Multi-day Spans
    for (const j of jobs) {
      if (j.scheduled_start) {
        const startStr = new Date(j.scheduled_start).toISOString().slice(0, 10);
        const days = j.estimated_days || 3;
        const endDateObj = new Date(j.scheduled_start);
        endDateObj.setDate(endDateObj.getDate() + (days - 1));
        const endStr = endDateObj.toISOString().slice(0, 10);

        events.push({
          id: `job-${j.id}`,
          title: `Roof: ${j.customer_name}`,
          date: startStr,
          endDate: endStr,
          type: 'job',
          status: j.status,
          customer: j.customer_name,
          address: j.address ? `${j.address}, ${j.city || ''}` : undefined,
          crewLead: j.crew_lead,
          contractValue: Number(j.contract_value),
          link: `/admin/jobs/${j.id}`,
        });
      }

      // Material Delivery Event
      if (j.material_delivered_at || (j.scheduled_start && j.material_status === 'delivered')) {
        const deliveryDate = (j.material_delivered_at || j.scheduled_start).slice(0, 10);
        events.push({
          id: `delivery-${j.id}`,
          title: `📦 Boom Delivery: ${j.job_number}`,
          date: deliveryDate,
          type: 'delivery',
          customer: j.customer_name,
          address: j.address ? `${j.address}, ${j.city || ''}` : undefined,
          link: `/admin/jobs/${j.id}`,
        });
      }

      // City Building Inspection Event
      if (j.permit_status === 'inspection_scheduled' && j.scheduled_start) {
        events.push({
          id: `permit-${j.id}`,
          title: `🏛️ City Permit Inspection: ${j.job_number}`,
          date: j.scheduled_start.slice(0, 10),
          type: 'city_inspection',
          customer: j.customer_name,
          address: j.address,
          link: `/admin/jobs/${j.id}`,
        });
      }
    }

    // 2. Follow-Up Tasks
    for (const t of tasks) {
      if (t.due_at) {
        events.push({
          id: `task-${t.id}`,
          title: `✓ Task: ${t.title}`,
          date: new Date(t.due_at).toISOString().slice(0, 10),
          type: 'task',
          status: t.priority,
          link: `/admin/tasks`,
        });
      }
    }

    // 3. Warranty Post-Job Check-ins
    for (const w of warranties) {
      if (w.checkin_6mo_due && !w.checkin_6mo_completed) {
        events.push({
          id: `war-6mo-${w.id}`,
          title: `🛡️ 6-Mo Check-in: ${w.customer_name || w.warranty_number}`,
          date: w.checkin_6mo_due.slice(0, 10),
          type: 'warranty',
          customer: w.customer_name,
          address: w.address,
          link: `/admin/warranties`,
        });
      }
      if (w.checkin_1yr_due && !w.checkin_1yr_completed) {
        events.push({
          id: `war-1yr-${w.id}`,
          title: `🏆 1-Yr Anniversary: ${w.customer_name || w.warranty_number}`,
          date: w.checkin_1yr_due.slice(0, 10),
          type: 'warranty',
          customer: w.customer_name,
          address: w.address,
          link: `/admin/warranties`,
        });
      }
    }

    // 4. In-Field Roof Inspections
    for (const i of inspections) {
      if (i.inspection_date) {
        events.push({
          id: `insp-${i.id}`,
          title: `🔍 Inspection (${i.roof_health_score}%): ${i.customer_name || i.inspection_number}`,
          date: i.inspection_date.slice(0, 10),
          type: 'inspection',
          customer: i.customer_name,
          address: i.address,
          link: `/inspection/${i.inspection_number}`,
        });
      }
    }

    return NextResponse.json({ events });
  } catch (err) {
    console.error('[api/admin/calendar GET]', err);
    return NextResponse.json({ error: 'Server error loading calendar events' }, { status: 500 });
  }
}
