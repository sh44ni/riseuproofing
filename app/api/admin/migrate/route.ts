import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MIGRATIONS = [
  // ── Core analytics events table ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id               BIGSERIAL PRIMARY KEY,
    session_id       TEXT NOT NULL,
    event_type       TEXT NOT NULL,
    page_path        TEXT NOT NULL,
    element          TEXT,
    label            TEXT,
    x_pct            FLOAT,
    y_pct            FLOAT,
    scroll_pct       INT,
    referrer         TEXT,
    user_agent       TEXT,
    device_type      TEXT,
    country          TEXT,
    city             TEXT,
    utm_source       TEXT,
    utm_medium       TEXT,
    utm_campaign     TEXT,
    duration_ms      INT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Add new columns to existing analytics_events tables
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS label TEXT`,
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_source TEXT`,
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_medium TEXT`,
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT`,
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS duration_ms INT`,

  // ── Indexes on analytics_events ───────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_ae_type_date    ON analytics_events (event_type, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ae_path_type    ON analytics_events (page_path, event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_ae_session      ON analytics_events (session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ae_created_at   ON analytics_events (created_at DESC)`,

  // ── Activity log — structured per-event feed ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS activity_log (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    page_path   TEXT NOT NULL,
    label       TEXT,
    element     TEXT,
    device_type TEXT,
    country     TEXT,
    city        TEXT,
    scroll_pct  INT,
    duration_ms INT,
    utm_source  TEXT,
    utm_medium  TEXT,
    utm_campaign TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_al_created_at ON activity_log (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_al_event_type ON activity_log (event_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_al_session    ON activity_log (session_id)`,

  // ── Leads ─────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS leads (
    id             BIGSERIAL PRIMARY KEY,
    form_type      TEXT NOT NULL,
    full_name      TEXT NOT NULL,
    phone          TEXT,
    email          TEXT,
    address        TEXT,
    zip            TEXT,
    service_type   TEXT,
    notes          TEXT,
    subject        TEXT,
    message        TEXT,
    source_page    TEXT,
    status         TEXT DEFAULT 'new',
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Call events ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS call_events (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT,
    page_path   TEXT,
    device_type TEXT,
    country     TEXT,
    city        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Admin sessions ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token      TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  )`,

  // ── Phase 1 CRM: Extended Leads columns ────────────────────────────────────
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'website'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_type TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_sqf INTEGER`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_age INTEGER`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS stories INTEGER`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS hoa BOOLEAN DEFAULT false`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'cool'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT`,

  // ── Phase 1 CRM: Activities timeline ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS activities (
    id            BIGSERIAL PRIMARY KEY,
    entity_type   TEXT NOT NULL,
    entity_id     BIGINT NOT NULL,
    activity_type TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    performed_by  TEXT,
    call_duration INT,
    metadata      JSONB,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities (entity_type, entity_id, created_at DESC)`,

  // ── Phase 1 CRM: Tasks & Reminders ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS tasks (
    id           BIGSERIAL PRIMARY KEY,
    entity_type  TEXT,
    entity_id    BIGINT,
    title        TEXT NOT NULL,
    description  TEXT,
    assigned_to  TEXT,
    due_at       TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    priority     TEXT DEFAULT 'normal',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks (due_at, completed_at)`,

  // ── Phase 2 CRM: Estimates & Proposals ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS estimates (
    id               BIGSERIAL PRIMARY KEY,
    lead_id          BIGINT REFERENCES leads(id),
    estimate_number  TEXT UNIQUE NOT NULL,
    version          INTEGER DEFAULT 1,
    status           TEXT DEFAULT 'draft',
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT,
    customer_email   TEXT,
    customer_address TEXT,
    customer_city    TEXT,
    customer_zip     TEXT,
    service_type     TEXT NOT NULL,
    roof_squares     NUMERIC(6,2) NOT NULL,
    roof_pitch       TEXT DEFAULT '4:12',
    stories          INTEGER DEFAULT 1,
    tearoff_layers   INTEGER DEFAULT 1,
    material_type    TEXT NOT NULL,
    material_cost    NUMERIC(10,2) NOT NULL,
    labor_cost       NUMERIC(10,2) NOT NULL,
    addons           JSONB DEFAULT '[]',
    subtotal         NUMERIC(10,2) NOT NULL,
    margin_pct       NUMERIC(5,2) DEFAULT 30.00,
    total            NUMERIC(10,2) NOT NULL,
    financing_months INTEGER DEFAULT 60,
    monthly_payment  NUMERIC(10,2),
    valid_until      DATE,
    notes            TEXT,
    sent_at          TIMESTAMPTZ,
    viewed_at        TIMESTAMPTZ,
    accepted_at      TIMESTAMPTZ,
    signature_name   TEXT,
    signature_data   TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_lead ON estimates (lead_id)`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates (status)`,

  // ── Phase 2 CRM: Jobs & Post-Sale Workflow ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS jobs (
    id                    BIGSERIAL PRIMARY KEY,
    lead_id               BIGINT REFERENCES leads(id),
    estimate_id           BIGINT REFERENCES estimates(id),
    job_number            TEXT UNIQUE NOT NULL,
    status                TEXT DEFAULT 'permit_pending',
    customer_name         TEXT NOT NULL,
    customer_phone        TEXT,
    customer_email        TEXT,
    address               TEXT,
    city                  TEXT,
    zip                   TEXT,
    service_type          TEXT,
    contract_value        NUMERIC(10,2) NOT NULL,
    permit_status         TEXT DEFAULT 'not_filed',
    permit_number         TEXT,
    permit_filed_at       DATE,
    permit_approved_at    DATE,
    material_status       TEXT DEFAULT 'not_ordered',
    material_ordered_at   DATE,
    material_delivered_at DATE,
    crew_lead             TEXT,
    crew_members          TEXT[],
    scheduled_start       DATE,
    estimated_days        INTEGER DEFAULT 3,
    actual_start          DATE,
    actual_end            DATE,
    weather_delays        INTEGER DEFAULT 0,
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_lead ON jobs (lead_id)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_estimate ON jobs (estimate_id)`,

  // ── Phase 3 CRM: Invoices & Milestone Payments ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS invoices (
    id             BIGSERIAL PRIMARY KEY,
    job_id         BIGINT REFERENCES jobs(id),
    estimate_id    BIGINT REFERENCES estimates(id),
    invoice_number TEXT UNIQUE NOT NULL,
    milestone_name TEXT NOT NULL,
    amount         NUMERIC(10,2) NOT NULL,
    status         TEXT DEFAULT 'pending',
    due_date       DATE NOT NULL,
    paid_at        TIMESTAMPTZ,
    payment_method TEXT,
    transaction_id TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_job ON invoices (job_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status)`,

  // ── Phase 3 CRM: Job Expenses & Receipts ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS job_expenses (
    id                     BIGSERIAL PRIMARY KEY,
    job_id                 BIGINT REFERENCES jobs(id) NOT NULL,
    category               TEXT NOT NULL,
    vendor                 TEXT NOT NULL,
    amount                 NUMERIC(10,2) NOT NULL,
    invoice_receipt_number TEXT,
    expense_date           DATE NOT NULL,
    notes                  TEXT,
    created_at             TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_job ON job_expenses (job_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category ON job_expenses (category)`,

  // ── Phase 4 CRM: Crew Members & Dispatch ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS crew_members (
    id             BIGSERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    phone          TEXT,
    role           TEXT NOT NULL,
    active         BOOLEAN DEFAULT true,
    current_job_id BIGINT REFERENCES jobs(id),
    skills         TEXT[] DEFAULT '{}',
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_crew_active ON crew_members (active, role)`,

  // ── Phase 4 CRM: Job Photos Documentation ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS job_photos (
    id           BIGSERIAL PRIMARY KEY,
    job_id       BIGINT REFERENCES jobs(id) NOT NULL,
    phase        TEXT NOT NULL,
    url          TEXT NOT NULL,
    caption      TEXT,
    uploaded_by  TEXT DEFAULT 'Field Crew',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_job_photos_job_phase ON job_photos (job_id, phase)`,

  // ── Phase 4 CRM: Warranties & Post-Completion Lifecycle ───────────────────
  `CREATE TABLE IF NOT EXISTS warranties (
    id                     BIGSERIAL PRIMARY KEY,
    job_id                 BIGINT REFERENCES jobs(id) NOT NULL,
    lead_id                BIGINT REFERENCES leads(id),
    warranty_number        TEXT UNIQUE NOT NULL,
    warranty_type          TEXT NOT NULL,
    start_date             DATE NOT NULL,
    expiration_date        DATE NOT NULL,
    coverage_details       TEXT,
    status                 TEXT DEFAULT 'active',
    checkin_6mo_due        DATE,
    checkin_1yr_due        DATE,
    checkin_6mo_completed  BOOLEAN DEFAULT false,
    checkin_1yr_completed  BOOLEAN DEFAULT false,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_warranties_job ON warranties (job_id)`,
  `CREATE INDEX IF NOT EXISTS idx_warranties_num ON warranties (warranty_number)`,

  // ── Phase 5 CRM: Digital Roof Inspection Reports ─────────────────────────
  `CREATE TABLE IF NOT EXISTS inspections (
    id                        BIGSERIAL PRIMARY KEY,
    lead_id                   BIGINT REFERENCES leads(id),
    job_id                    BIGINT REFERENCES jobs(id),
    inspection_number         TEXT UNIQUE NOT NULL,
    inspector_name            TEXT NOT NULL,
    inspection_date           DATE NOT NULL,
    roof_health_score         INTEGER NOT NULL DEFAULT 85,
    findings                  JSONB NOT NULL DEFAULT '[]',
    urgent_action_required    BOOLEAN DEFAULT false,
    estimated_remaining_years INTEGER DEFAULT 3,
    notes                     TEXT,
    created_at                TIMESTAMPTZ DEFAULT NOW(),
    updated_at                TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_lead ON inspections (lead_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_num ON inspections (inspection_number)`,

  // ── Phase 5 CRM: Customizable Message Templates Studio ───────────────────
  `CREATE TABLE IF NOT EXISTS templates (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    type        TEXT DEFAULT 'both',
    subject     TEXT,
    body        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_templates_cat ON templates (category)`,

  // ── Phase 6 CRM: Customer Reviews & Reputation Management ──────────────────
  `CREATE TABLE IF NOT EXISTS reviews (
    id             BIGSERIAL PRIMARY KEY,
    lead_id        BIGINT REFERENCES leads(id),
    job_id         BIGINT REFERENCES jobs(id),
    customer_name  TEXT NOT NULL,
    customer_city  TEXT,
    rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback       TEXT,
    service_type   TEXT,
    source         TEXT DEFAULT 'direct',
    status         TEXT DEFAULT 'pending',
    review_token   TEXT UNIQUE,
    google_clicked BOOLEAN DEFAULT false,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews (review_token)`,

  // ── Phase 6 CRM: System & Pricing Settings ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Phase 7 CRM: Role-Based Access Control (RBAC) & Users ──────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('owner', 'project_manager', 'sales_rep', 'field_foreman', 'office_admin')),
    status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url    TEXT,
    last_login_at TIMESTAMPTZ,
    permissions   TEXT[] DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}'`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users (role, status)`,
  `CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions)`,
  `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`,
  `CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions (user_id)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id)`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_manager_id BIGINT REFERENCES users(id)`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS foreman_id BIGINT REFERENCES users(id)`,
  `ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id)`,
  `ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_name TEXT`,

  // ── Purge historical admin-page visits from analytics, activities & calls ──
  `DELETE FROM analytics_events WHERE page_path LIKE '/admin%'`,
  `DELETE FROM activity_log WHERE page_path LIKE '/admin%'`,
  `DELETE FROM call_events WHERE page_path LIKE '/admin%'`,
];

export async function POST() {
  try {
    for (const sql of MIGRATIONS) {
      await query(sql);
    }

    // Seed default users if none exist
    const existingUsers = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    if (parseInt(existingUsers[0]?.count || '0', 10) === 0) {
      const { hashPassword } = await import('@/lib/admin-auth');
      const ownerPass = process.env.ADMIN_PASSWORD || 'RiseUp2025!';

      const defaultUsers = [
        {
          name: 'Sam Martinez',
          email: 'owner@riseuproofing.com',
          phone: '(747) 245-0035',
          role: 'owner',
          pass: ownerPass,
        },
        {
          name: 'Carlos Ramirez',
          email: 'pm@riseuproofing.com',
          phone: '(818) 555-0142',
          role: 'project_manager',
          pass: 'RiseUpPM2025!',
        },
        {
          name: 'Jessica Hayes',
          email: 'sales@riseuproofing.com',
          phone: '(818) 555-0199',
          role: 'sales_rep',
          pass: 'RiseUpSales2025!',
        },
        {
          name: 'Marco Silva',
          email: 'foreman@riseuproofing.com',
          phone: '(818) 555-0211',
          role: 'field_foreman',
          pass: 'RiseUpCrew2025!',
        },
        {
          name: 'Elena Rostova',
          email: 'office@riseuproofing.com',
          phone: '(747) 245-0035',
          role: 'office_admin',
          pass: 'RiseUpOffice2025!',
        },
      ];

      for (const u of defaultUsers) {
        const { hash, salt } = hashPassword(u.pass);
        await query(
          `INSERT INTO users (name, email, phone, role, password_hash, salt, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           ON CONFLICT (email) DO NOTHING`,
          [u.name, u.email, u.phone, u.role, hash, salt]
        );
      }
    }

    // Link any orphan active sessions to the Owner user
    const owner = await query<{ id: number }>('SELECT id FROM users WHERE role = \'owner\' LIMIT 1');
    if (owner.length > 0) {
      await query('UPDATE admin_sessions SET user_id = $1 WHERE user_id IS NULL', [owner[0].id]);
    }

    return NextResponse.json({ ok: true, message: 'Migrations and RBAC initialization complete' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

