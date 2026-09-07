import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export type CalendarSourceType = 'pipeline_job' | 'pipeline_lead' | 'manual_task' | 'warranty' | 'inspection';
export type CalendarEventType = 'roof_install' | 'boom_delivery' | 'city_permit' | 'warranty_checkin' | 'roof_inspection' | 'task';

export interface CalendarAssignee {
  id?: number;
  name: string;
  role?: string;
  avatar_url?: string | null;
}

export interface CalendarEvent {
  id: string;
  source_type: CalendarSourceType;
  source_id: number;
  event_type: CalendarEventType;
  title: string;
  start_at: string;
  end_at?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  time?: string; // e.g. "09:30 AM" or undefined if all-day
  is_all_day: boolean;
  status?: string;
  customer?: string;
  address?: string;
  city?: string;
  phone?: string;
  contract_value?: number;
  crew_lead?: string;
  assignees: CalendarAssignee[];
  assignee_ids: number[];
  created_by?: string;
  notes?: string;
  link?: string;
  is_synced: boolean;
  priority?: string;
  completed?: boolean;
}

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'jobs:view', 'leads:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const filterEventType = searchParams.get('event_type');
  const filterPersonId = searchParams.get('person_id');

  try {
    const [jobs, leads, tasks, warranties, inspections, users] = await Promise.all([
      // 1. Pipeline Jobs
      query<any>(`
        SELECT 
          j.id, j.job_number, j.status, j.customer_name, j.customer_phone, j.customer_email,
          j.address, j.city, j.zip, j.service_type, j.contract_value,
          j.scheduled_start, j.estimated_days, j.actual_start, j.actual_end,
          j.material_delivered_at, j.material_status, j.permit_approved_at, j.permit_status,
          j.crew_lead, j.crew_members, j.notes,
          u_foreman.id as foreman_id, u_foreman.name as foreman_name, u_foreman.avatar_url as foreman_avatar, u_foreman.role as foreman_role
        FROM jobs j
        LEFT JOIN users u_foreman ON j.assigned_foreman_id = u_foreman.id
        WHERE j.scheduled_start IS NOT NULL 
           OR j.material_delivered_at IS NOT NULL 
           OR j.permit_approved_at IS NOT NULL
           OR j.permit_status = 'inspection_scheduled'
        ORDER BY j.scheduled_start ASC
      `),

      // 2. Scheduled Visits from Pipeline Leads (Stage 3 12-point inspections)
      query<any>(`
        SELECT 
          l.id, l.full_name, l.phone, l.email, l.address, l.city, l.zip,
          l.service_type, l.site_visit_scheduled_at, l.pipeline_stage, l.status,
          u.id as assigned_user_id, u.name as assigned_user_name, u.role as assigned_user_role, u.avatar_url as assigned_user_avatar
        FROM leads l
        LEFT JOIN users u ON l.assigned_to_user_id = u.id
        WHERE l.site_visit_scheduled_at IS NOT NULL
        ORDER BY l.site_visit_scheduled_at ASC
      `),

      // 3. Tasks Table (reused for manual calendar tasks + CRM tasks)
      query<any>(`
        SELECT 
          t.id, t.title, t.description, t.assigned_to, t.assigned_to_user_id,
          t.due_at, t.end_at, t.completed_at, t.priority, t.event_type, t.entity_type, t.entity_id,
          u.name as user_name, u.role as user_role, u.avatar_url as user_avatar,
          u_creator.name as creator_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        LEFT JOIN users u_creator ON t.created_by_user_id = u_creator.id
        WHERE t.due_at IS NOT NULL
        ORDER BY t.due_at ASC
      `),

      // 4. Warranties Check-ins
      query<any>(`
        SELECT 
          w.id, w.warranty_number, w.warranty_type, w.checkin_6mo_due, w.checkin_1yr_due, 
          w.checkin_6mo_completed, w.checkin_1yr_completed, w.job_id,
          j.customer_name, j.customer_phone, j.address, j.city
        FROM warranties w
        LEFT JOIN jobs j ON w.job_id = j.id
        WHERE w.status = 'active'
      `),

      // 5. In-Field Roof Inspections
      query<any>(`
        SELECT 
          i.id, i.inspection_number, i.inspection_date, i.inspector_name, i.roof_health_score,
          i.urgent_action_required, i.lead_id,
          l.full_name as customer_name, l.phone as customer_phone, l.address, l.city
        FROM inspections i
        LEFT JOIN leads l ON i.lead_id = l.id
        WHERE i.inspection_date IS NOT NULL
        ORDER BY i.inspection_date DESC
      `),

      // 6. Active Team Directory for Swimlanes & Filtering
      query<{ id: number; name: string; email: string; role: string; avatar_url: string | null }>(`
        SELECT id, name, email, role, avatar_url
        FROM users
        WHERE status = 'active'
        ORDER BY 
          CASE role
            WHEN 'owner' THEN 1
            WHEN 'project_manager' THEN 2
            WHEN 'field_foreman' THEN 3
            WHEN 'sales_rep' THEN 4
            WHEN 'office_admin' THEN 5
            ELSE 6
          END, name ASC
      `),
    ]);

    // Map users by lowercase name for fast matching of text crew names
    const userByName = new Map<string, { id: number; name: string; role: string; avatar_url: string | null }>();
    for (const u of users) {
      userByName.set(u.name.toLowerCase().trim(), u);
    }

    const events: CalendarEvent[] = [];

    // Helper: format time if present
    const formatTimeFromIso = (isoStr: string): { time?: string; isAllDay: boolean } => {
      if (!isoStr.includes('T')) return { isAllDay: true };
      const d = new Date(isoStr);
      if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
        return { isAllDay: true };
      }
      return {
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        isAllDay: false,
      };
    };

    // ── 1. MAP JOBS (Roof Installs, Boom Deliveries, City Permits) ──
    for (const j of jobs) {
      // Build assignees list from crew_lead + crew_members + foreman_id
      const jobAssignees: CalendarAssignee[] = [];
      const jobAssigneeIds: number[] = [];

      if (j.foreman_id) {
        jobAssignees.push({
          id: j.foreman_id,
          name: j.foreman_name,
          role: j.foreman_role,
          avatar_url: j.foreman_avatar,
        });
        jobAssigneeIds.push(Number(j.foreman_id));
      } else if (j.crew_lead) {
        const matched = userByName.get(j.crew_lead.toLowerCase().trim());
        if (matched) {
          jobAssignees.push({
            id: matched.id,
            name: matched.name,
            role: matched.role,
            avatar_url: matched.avatar_url,
          });
          jobAssigneeIds.push(matched.id);
        } else {
          jobAssignees.push({ name: j.crew_lead, role: 'Foreman' });
        }
      }

      if (Array.isArray(j.crew_members)) {
        for (const member of j.crew_members) {
          if (!member) continue;
          const matched = userByName.get(String(member).toLowerCase().trim());
          if (matched) {
            if (!jobAssigneeIds.includes(matched.id)) {
              jobAssignees.push({
                id: matched.id,
                name: matched.name,
                role: matched.role,
                avatar_url: matched.avatar_url,
              });
              jobAssigneeIds.push(matched.id);
            }
          } else {
            jobAssignees.push({ name: member, role: 'Crew Member' });
          }
        }
      }

      // 1A. Roof Install Multi-day Event
      if (j.scheduled_start) {
        const startStr = new Date(j.scheduled_start).toISOString().slice(0, 10);
        const days = j.estimated_days || 3;
        const endDateObj = new Date(j.scheduled_start);
        endDateObj.setDate(endDateObj.getDate() + (days - 1));
        const endStr = endDateObj.toISOString().slice(0, 10);

        events.push({
          id: `job-${j.id}`,
          source_type: 'pipeline_job',
          source_id: j.id,
          event_type: 'roof_install',
          title: `Roof Install: ${j.customer_name}`,
          start_at: new Date(j.scheduled_start).toISOString(),
          end_at: endDateObj.toISOString(),
          date: startStr,
          endDate: endStr,
          is_all_day: true,
          status: j.status,
          customer: j.customer_name,
          address: j.address ? `${j.address}${j.city ? `, ${j.city}` : ''}` : undefined,
          city: j.city,
          phone: j.customer_phone,
          contract_value: Number(j.contract_value) || 0,
          crew_lead: j.crew_lead,
          assignees: jobAssignees,
          assignee_ids: jobAssigneeIds,
          notes: j.notes,
          link: `/admin/jobs/${j.id}`,
          is_synced: true,
        });
      }

      // 1B. Boom Delivery Event
      if (j.material_delivered_at || (j.scheduled_start && j.material_status === 'delivered')) {
        const rawDate = j.material_delivered_at || j.scheduled_start;
        const dateStr = new Date(rawDate).toISOString().slice(0, 10);

        events.push({
          id: `delivery-${j.id}`,
          source_type: 'pipeline_job',
          source_id: j.id,
          event_type: 'boom_delivery',
          title: `📦 Boom Delivery: ${j.job_number}`,
          start_at: new Date(rawDate).toISOString(),
          date: dateStr,
          is_all_day: true,
          status: j.material_status || 'scheduled',
          customer: j.customer_name,
          address: j.address ? `${j.address}${j.city ? `, ${j.city}` : ''}` : undefined,
          city: j.city,
          phone: j.customer_phone,
          crew_lead: j.crew_lead,
          assignees: jobAssignees,
          assignee_ids: jobAssigneeIds,
          link: `/admin/jobs/${j.id}`,
          is_synced: true,
        });
      }

      // 1C. City Permit Inspection Event
      if (j.permit_approved_at || j.permit_status === 'inspection_scheduled') {
        const rawDate = j.permit_approved_at || j.scheduled_start;
        const dateStr = new Date(rawDate).toISOString().slice(0, 10);

        events.push({
          id: `permit-${j.id}`,
          source_type: 'pipeline_job',
          source_id: j.id,
          event_type: 'city_permit',
          title: `🏛️ City Permit Inspection: ${j.job_number}`,
          start_at: new Date(rawDate).toISOString(),
          date: dateStr,
          is_all_day: true,
          status: j.permit_status,
          customer: j.customer_name,
          address: j.address,
          city: j.city,
          assignees: jobAssignees,
          assignee_ids: jobAssigneeIds,
          link: `/admin/jobs/${j.id}`,
          is_synced: true,
        });
      }
    }

    // ── 2. MAP STAGE 3 SITE VISITS FROM PIPELINE LEADS ──
    for (const l of leads) {
      const { time, isAllDay } = formatTimeFromIso(l.site_visit_scheduled_at);
      const dateStr = new Date(l.site_visit_scheduled_at).toISOString().slice(0, 10);

      const leadAssignees: CalendarAssignee[] = [];
      const leadAssigneeIds: number[] = [];

      if (l.assigned_user_id) {
        leadAssignees.push({
          id: l.assigned_user_id,
          name: l.assigned_user_name,
          role: l.assigned_user_role,
          avatar_url: l.assigned_user_avatar,
        });
        leadAssigneeIds.push(Number(l.assigned_user_id));
      }

      events.push({
        id: `lead-visit-${l.id}`,
        source_type: 'pipeline_lead',
        source_id: l.id,
        event_type: 'roof_inspection',
        title: `12-Pt Roof Visit: ${l.full_name}`,
        start_at: new Date(l.site_visit_scheduled_at).toISOString(),
        date: dateStr,
        time,
        is_all_day: isAllDay,
        status: l.pipeline_stage,
        customer: l.full_name,
        address: l.address ? `${l.address}${l.city ? `, ${l.city}` : ''}` : undefined,
        city: l.city,
        phone: l.phone,
        assignees: leadAssignees,
        assignee_ids: leadAssigneeIds,
        link: `/admin/leads/${l.id}`,
        is_synced: true,
      });
    }

    // ── 3. MAP IN-FIELD DIGITAL INSPECTIONS ──
    for (const i of inspections) {
      const dateStr = new Date(i.inspection_date).toISOString().slice(0, 10);

      const inspAssignees: CalendarAssignee[] = [];
      const inspAssigneeIds: number[] = [];

      if (i.inspector_name) {
        const matched = userByName.get(i.inspector_name.toLowerCase().trim());
        if (matched) {
          inspAssignees.push({
            id: matched.id,
            name: matched.name,
            role: matched.role,
            avatar_url: matched.avatar_url,
          });
          inspAssigneeIds.push(matched.id);
        } else {
          inspAssignees.push({ name: i.inspector_name, role: 'Inspector' });
        }
      }

      events.push({
        id: `insp-${i.id}`,
        source_type: 'inspection',
        source_id: i.id,
        event_type: 'roof_inspection',
        title: `🔍 Inspection (${i.roof_health_score}%): ${i.customer_name || i.inspection_number}`,
        start_at: new Date(i.inspection_date).toISOString(),
        date: dateStr,
        is_all_day: true,
        status: i.urgent_action_required ? 'Urgent Action' : 'Completed',
        customer: i.customer_name,
        address: i.address,
        city: i.city,
        phone: i.customer_phone,
        assignees: inspAssignees,
        assignee_ids: inspAssigneeIds,
        link: `/inspection/${i.inspection_number}`,
        is_synced: true,
      });
    }

    // ── 4. MAP WARRANTY CHECK-INS ──
    for (const w of warranties) {
      if (w.checkin_6mo_due && !w.checkin_6mo_completed) {
        const dateStr = new Date(w.checkin_6mo_due).toISOString().slice(0, 10);
        events.push({
          id: `war-6mo-${w.id}`,
          source_type: 'warranty',
          source_id: w.id,
          event_type: 'warranty_checkin',
          title: `🛡️ 6-Mo Check-in: ${w.customer_name || w.warranty_number}`,
          start_at: new Date(w.checkin_6mo_due).toISOString(),
          date: dateStr,
          is_all_day: true,
          status: 'Pending 6-Month Review',
          customer: w.customer_name,
          address: w.address,
          city: w.city,
          phone: w.customer_phone,
          assignees: [{ name: 'Customer Success', role: 'Support' }],
          assignee_ids: [],
          link: `/admin/warranties`,
          is_synced: true,
        });
      }

      if (w.checkin_1yr_due && !w.checkin_1yr_completed) {
        const dateStr = new Date(w.checkin_1yr_due).toISOString().slice(0, 10);
        events.push({
          id: `war-1yr-${w.id}`,
          source_type: 'warranty',
          source_id: w.id,
          event_type: 'warranty_checkin',
          title: `🏆 1-Yr Anniversary: ${w.customer_name || w.warranty_number}`,
          start_at: new Date(w.checkin_1yr_due).toISOString(),
          date: dateStr,
          is_all_day: true,
          status: '1-Year Milestone',
          customer: w.customer_name,
          address: w.address,
          city: w.city,
          phone: w.customer_phone,
          assignees: [{ name: 'Customer Success', role: 'Support' }],
          assignee_ids: [],
          link: `/admin/warranties`,
          is_synced: true,
        });
      }
    }

    // ── 5. MAP MANUAL TASKS & CRM TASKS ──
    for (const t of tasks) {
      const { time, isAllDay } = formatTimeFromIso(t.due_at);
      const dateStr = new Date(t.due_at).toISOString().slice(0, 10);
      const endDateStr = t.end_at ? new Date(t.end_at).toISOString().slice(0, 10) : undefined;

      const taskAssignees: CalendarAssignee[] = [];
      const taskAssigneeIds: number[] = [];

      if (t.assigned_to_user_id) {
        taskAssignees.push({
          id: t.assigned_to_user_id,
          name: t.user_name || t.assigned_to,
          role: t.user_role,
          avatar_url: t.user_avatar,
        });
        taskAssigneeIds.push(Number(t.assigned_to_user_id));
      } else if (t.assigned_to) {
        const matched = userByName.get(t.assigned_to.toLowerCase().trim());
        if (matched) {
          taskAssignees.push({
            id: matched.id,
            name: matched.name,
            role: matched.role,
            avatar_url: matched.avatar_url,
          });
          taskAssigneeIds.push(matched.id);
        } else {
          taskAssignees.push({ name: t.assigned_to, role: 'Staff' });
        }
      }

      events.push({
        id: `task-${t.id}`,
        source_type: 'manual_task',
        source_id: t.id,
        event_type: (t.event_type as CalendarEventType) || 'task',
        title: t.title,
        start_at: new Date(t.due_at).toISOString(),
        end_at: t.end_at ? new Date(t.end_at).toISOString() : undefined,
        date: dateStr,
        endDate: endDateStr,
        time,
        is_all_day: isAllDay,
        status: t.completed_at ? 'Completed' : (t.priority || 'normal'),
        priority: t.priority,
        completed: Boolean(t.completed_at),
        notes: t.description,
        assignees: taskAssignees,
        assignee_ids: taskAssigneeIds,
        created_by: t.creator_name,
        link: undefined, // editable on calendar
        is_synced: false,
      });
    }

    // ── 6. APPLY OPTIONAL FILTERS ──
    let filteredEvents = events;

    if (filterEventType && filterEventType !== 'all') {
      filteredEvents = filteredEvents.filter((e) => e.event_type === filterEventType);
    }

    if (filterPersonId && filterPersonId !== 'all') {
      const pid = parseInt(filterPersonId, 10);
      filteredEvents = filteredEvents.filter(
        (e) => e.assignee_ids.includes(pid) || e.assignees.some((a) => a.id === pid)
      );
    }

    return NextResponse.json({
      ok: true,
      events: filteredEvents,
      team: users,
      current_user: {
        id: auth.user.id,
        name: auth.user.name,
        role: auth.user.role,
        avatar_url: auth.user.avatar_url,
      },
    });
  } catch (err) {
    console.error('[api/admin/calendar GET]', err);
    return NextResponse.json({ error: 'Server error loading calendar events' }, { status: 500 });
  }
}
