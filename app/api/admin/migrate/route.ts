import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/admin-auth';
import crypto from 'crypto';

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
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
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

  // ── Seed realistic professional portraits for initial team ──
  `UPDATE users SET avatar_url = CASE role
    WHEN 'owner' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
    WHEN 'project_manager' THEN 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
    WHEN 'sales_rep' THEN 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
    WHEN 'field_foreman' THEN 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80'
    WHEN 'office_admin' THEN 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80'
  END
  WHERE avatar_url IS NULL`,

  // ── Database Performance & Latency Optimization Indexes ────────────────────
  `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status_priority ON leads (status, priority, lead_score)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (lead_source)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_status_paid ON invoices (status, paid_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_pending_due ON tasks (due_at ASC) WHERE completed_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at)`,

  // ── Access Tokens for Secure Customer Portals ──────────────────────────────
  `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE`,
  `ALTER TABLE inspections ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE`,
  `ALTER TABLE warranties ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_access_token ON estimates (access_token)`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_access_token ON inspections (access_token)`,
  `CREATE INDEX IF NOT EXISTS idx_warranties_access_token ON warranties (access_token)`,

  // ── Dynamic Project Estimator Tables ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS estimator_services (
    id           SERIAL PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    name         TEXT NOT NULL,
    short_label  TEXT NOT NULL,
    icon_key     TEXT NOT NULL,
    badge_label  TEXT,
    sort_order   INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS estimator_pricing_rules (
    id                    SERIAL PRIMARY KEY,
    service_id            INT NOT NULL REFERENCES estimator_services(id) ON DELETE CASCADE,
    price_per_sqft_low    NUMERIC(10,2) NOT NULL,
    price_per_sqft_high   NUMERIC(10,2) NOT NULL,
    base_fee_low          NUMERIC(10,2) NOT NULL DEFAULT 0,
    base_fee_high         NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_sqft              INT DEFAULT 500,
    max_sqft              INT DEFAULT 12000,
    apr_available         BOOLEAN NOT NULL DEFAULT true,
    financing_apr         NUMERIC(5,2) DEFAULT 0,
    financing_term_months INT DEFAULT 60,
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_by            TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS estimator_size_presets (
    id          SERIAL PRIMARY KEY,
    service_id  INT REFERENCES estimator_services(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    sqft_value  INT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS estimator_leads (
    id             BIGSERIAL PRIMARY KEY,
    service_id     INT REFERENCES estimator_services(id) ON DELETE SET NULL,
    sqft_entered   INT NOT NULL,
    estimate_low   NUMERIC(10,2) NOT NULL,
    estimate_high  NUMERIC(10,2) NOT NULL,
    source         TEXT NOT NULL CHECK (source IN ('preset', 'custom')),
    session_id     TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_estimator_leads_created ON estimator_leads (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_estimator_pricing_service ON estimator_pricing_rules (service_id)`,

  // ── Dynamic Financing Calculator Tables ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS financing_plans (
    id                   SERIAL PRIMARY KEY,
    name                 TEXT NOT NULL,
    apr                  NUMERIC(5,2) NOT NULL DEFAULT 0,
    term_months          INT NOT NULL,
    min_down_payment_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_default           BOOLEAN NOT NULL DEFAULT false,
    is_active            BOOLEAN NOT NULL DEFAULT true,
    sort_order           INT NOT NULL DEFAULT 0,
    badge_label          TEXT,
    description          TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS financing_settings (
    id                      INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    min_project_cost        NUMERIC(10,2) NOT NULL DEFAULT 5000,
    max_project_cost        NUMERIC(10,2) NOT NULL DEFAULT 50000,
    default_project_cost    NUMERIC(10,2) NOT NULL DEFAULT 16500,
    credit_check_copy_flag  BOOLEAN NOT NULL DEFAULT true,
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_by              TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS financing_calculations (
    id              BIGSERIAL PRIMARY KEY,
    plan_id         INT REFERENCES financing_plans(id) ON DELETE SET NULL,
    project_cost    NUMERIC(10,2) NOT NULL,
    down_payment    NUMERIC(10,2) NOT NULL DEFAULT 0,
    monthly_payment NUMERIC(10,2) NOT NULL,
    session_id      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_financing_calculations_created ON financing_calculations (created_at DESC)`,

  // ── Phase 8 CRM: Clients 360° Customer Profiles ───────────────────────────
  `CREATE TABLE IF NOT EXISTS clients (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           TEXT NOT NULL,
    phone               TEXT,
    phone_normalized    TEXT,
    email               TEXT,
    secondary_phone     TEXT,
    address             TEXT,
    city                TEXT,
    zip                 TEXT,
    property_type       TEXT DEFAULT 'Single Family',
    roof_type           TEXT,
    roof_sqf            INTEGER,
    roof_age            INTEGER,
    stories             INTEGER DEFAULT 1,
    hoa                 BOOLEAN DEFAULT false,
    status              TEXT DEFAULT 'lead',
    tags                TEXT[] DEFAULT '{"New Lead"}',
    total_revenue       NUMERIC(10,2) DEFAULT 0,
    total_jobs_count    INTEGER DEFAULT 0,
    notes               TEXT,
    assigned_to_user_id BIGINT REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_clients_phone_norm ON clients (phone_normalized)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (full_name)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_created ON clients (created_at DESC)`,

  // ── Add client_id FK to all dependent CRM tables ────────────────────────────
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE warranties ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE inspections ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE activities ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL`,

  `CREATE INDEX IF NOT EXISTS idx_leads_client ON leads (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_client ON estimates (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_warranties_client ON warranties (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_client ON inspections (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activities_client ON activities (client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks (client_id)`,

  // ── Phase 9 CRM: Lead & Client Origin Attribution (Website vs. Team Member) ─
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_detail TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_leads_source_type ON leads (source_type, created_by_user_id)`,

  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website'`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS acquired_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source_detail TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_since TIMESTAMPTZ DEFAULT NOW()`,
  `CREATE INDEX IF NOT EXISTS idx_clients_acquired_by ON clients (acquired_by_user_id)`,

  // Backfill automatic website recognition
  `UPDATE leads SET source_type = 'website', lead_source_detail = 'Website Storm Promo' WHERE (form_type = 'storm_promo' OR lead_source = 'storm_promo_popup') AND (lead_source_detail IS NULL OR source_type = 'website')`,
  `UPDATE leads SET source_type = 'website', lead_source_detail = 'Website Contact Form' WHERE form_type = 'contact' AND (lead_source_detail IS NULL OR source_type = 'website')`,
  `UPDATE leads SET source_type = 'website', lead_source_detail = 'Website Estimate Request' WHERE (form_type = 'estimate' OR form_type = 'estimator_full') AND (lead_source_detail IS NULL OR source_type = 'website')`,
  `UPDATE leads SET source_type = 'website', lead_source_detail = 'Website Inbound' WHERE created_by_user_id IS NULL AND lead_source_detail IS NULL`,
  `UPDATE clients SET source_type = 'website', lead_source_detail = 'Website Inbound' WHERE acquired_by_user_id IS NULL AND (lead_source_detail IS NULL OR source_type IS NULL)`,

  // ── Phase 10 CRM: Unified 5-Stage Sales & Operations Pipeline ───────────────
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'stage_1_lead_gen'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS initial_contacted_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_visit_scheduled_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_visit_completed_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_completed_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_confirmed BOOLEAN DEFAULT false`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS discount_applied TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS financing_interested BOOLEAN DEFAULT false`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10,2) DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads (pipeline_stage, stage_entered_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads (assigned_to_user_id, pipeline_stage)`,

  // Historical backfill into 5 pipeline stages
  // ── Phase 11 CRM: Unified Field Ops Calendar & Manual Tasks ────────────────
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'task'`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_calendar ON tasks (due_at, completed_at)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks (assigned_to_user_id)`,

  // ── Phase 12 CRM: Dynamic Roles, Granular Permissions, Invitations & Lead Attribution ──
  `CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_protected BOOLEAN DEFAULT FALSE,
    created_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('own', 'assigned', 'all')),
    PRIMARY KEY (role_id, permission_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
  )`,
  `CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    invited_role_ids INT[] NOT NULL,
    invited_by BIGINT REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
  )`,
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`,
  `ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('invited', 'active', 'deactivated', 'inactive', 'suspended'))`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_role_snapshot TEXT`,
  `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id)`,
  `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS created_by_role_snapshot TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id)`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by_role_snapshot TEXT`,
];

async function handleMigration(req: NextRequest) {
  // Enforce Owner/PM authentication or migration key (header or query param)
  const currentUser = await getCurrentUser();
  const headerKey = req.headers.get('x-migration-key');
  const queryKey = req.nextUrl.searchParams.get('key');
  const migrationKey = headerKey || queryKey;

  const isAuthorized =
    (currentUser && (currentUser.role === 'owner' || currentUser.role === 'project_manager')) ||
    (process.env.MIGRATION_KEY && migrationKey === process.env.MIGRATION_KEY) ||
    (process.env.ADMIN_PASSWORD && migrationKey === process.env.ADMIN_PASSWORD);

  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden. Owner authentication or valid migration key required.' },
      { status: 403 }
    );
  }

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
          email: 'owner@riseuprac.com',
          phone: '(747) 245-0035',
          role: 'owner',
          pass: ownerPass,
        },
        {
          name: 'Carlos Ramirez',
          email: 'pm@riseuprac.com',
          phone: '(818) 555-0142',
          role: 'project_manager',
          pass: 'RiseUpPM2025!',
        },
        {
          name: 'Jessica Hayes',
          email: 'sales@riseuprac.com',
          phone: '(818) 555-0199',
          role: 'sales_rep',
          pass: 'RiseUpSales2025!',
        },
        {
          name: 'Marco Silva',
          email: 'foreman@riseuprac.com',
          phone: '(818) 555-0211',
          role: 'field_foreman',
          pass: 'RiseUpCrew2025!',
        },
        {
          name: 'Elena Rostova',
          email: 'office@riseuprac.com',
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

    // Backfill access tokens for existing estimates, inspections, and warranties
    const pendingEstimates = await query<{ id: number }>('SELECT id FROM estimates WHERE access_token IS NULL');
    for (const est of pendingEstimates) {
      const tok = crypto.randomBytes(16).toString('hex');
      await query('UPDATE estimates SET access_token = $1 WHERE id = $2', [tok, est.id]);
    }

    const pendingInspections = await query<{ id: number }>('SELECT id FROM inspections WHERE access_token IS NULL');
    for (const insp of pendingInspections) {
      const tok = crypto.randomBytes(16).toString('hex');
      await query('UPDATE inspections SET access_token = $1 WHERE id = $2', [tok, insp.id]);
    }

    const pendingWarranties = await query<{ id: number }>('SELECT id FROM warranties WHERE access_token IS NULL');
    for (const war of pendingWarranties) {
      const tok = crypto.randomBytes(16).toString('hex');
      await query('UPDATE warranties SET access_token = $1 WHERE id = $2', [tok, war.id]);
    }

    // ── Backfill / Link Historical Data to Clients ──────────────────────────
    const unlinkedLeads = await query<any>('SELECT * FROM leads WHERE client_id IS NULL ORDER BY created_at ASC');
    if (unlinkedLeads.length > 0) {
      const { findOrCreateClient, recalculateClientStats } = await import('@/lib/crm-clients');
      for (const lead of unlinkedLeads) {
        if (!lead.full_name) continue;
        const client = await findOrCreateClient({
          fullName: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          city: lead.city,
          zip: lead.zip,
          propertyType: lead.property_type,
          roofType: lead.roof_type,
          roofSqf: lead.roof_sqf,
          roofAge: lead.roof_age,
          stories: lead.stories,
          hoa: lead.hoa,
          notes: lead.notes,
        });

        await query('UPDATE leads SET client_id = $1 WHERE id = $2', [client.id, lead.id]);
      }
    }

    // Link unlinked jobs by matching lead_id or phone
    const unlinkedJobs = await query<any>('SELECT * FROM jobs WHERE client_id IS NULL');
    if (unlinkedJobs.length > 0) {
      const { findOrCreateClient, recalculateClientStats } = await import('@/lib/crm-clients');
      for (const job of unlinkedJobs) {
        let clientId: number | null = null;
        if (job.lead_id) {
          const leadRow = await query<{ client_id: number }>('SELECT client_id FROM leads WHERE id = $1', [job.lead_id]);
          if (leadRow[0]?.client_id) {
            clientId = leadRow[0].client_id;
          }
        }
        if (!clientId && job.customer_name) {
          const client = await findOrCreateClient({
            fullName: job.customer_name,
            phone: job.customer_phone,
            email: job.customer_email,
            address: job.address,
            city: job.city,
            zip: job.zip,
          });
          clientId = client.id;
        }
        if (clientId) {
          await query('UPDATE jobs SET client_id = $1 WHERE id = $2', [clientId, job.id]);
        }
      }
    }

    // Link unlinked estimates
    await query(`
      UPDATE estimates e
      SET client_id = COALESCE(
        (SELECT client_id FROM leads l WHERE l.id = e.lead_id),
        (SELECT client_id FROM jobs j WHERE j.estimate_id = e.id)
      )
      WHERE e.client_id IS NULL
    `);

    // Link unlinked invoices
    await query(`
      UPDATE invoices i
      SET client_id = (SELECT client_id FROM jobs j WHERE j.id = i.job_id)
      WHERE i.client_id IS NULL AND i.job_id IS NOT NULL
    `);

    // Link unlinked warranties
    await query(`
      UPDATE warranties w
      SET client_id = COALESCE(
        (SELECT client_id FROM jobs j WHERE j.id = w.job_id),
        (SELECT client_id FROM leads l WHERE l.id = w.lead_id)
      )
      WHERE w.client_id IS NULL
    `);

    // Link unlinked inspections
    await query(`
      UPDATE inspections ins
      SET client_id = COALESCE(
        (SELECT client_id FROM leads l WHERE l.id = ins.lead_id),
        (SELECT client_id FROM jobs j WHERE j.id = ins.job_id)
      )
      WHERE ins.client_id IS NULL
    `);

    // Phase 9: Backfill source attribution for historical leads
    await query(`
      UPDATE leads
      SET source_type = CASE
            WHEN lead_source ILIKE '%staff%' OR lead_source ILIKE '%referral%' OR lead_source ILIKE '%door%' OR lead_source ILIKE '%canvass%' THEN 'team_member'
            ELSE 'website'
          END,
          created_by_user_id = CASE
            WHEN (lead_source ILIKE '%staff%' OR lead_source ILIKE '%referral%' OR lead_source ILIKE '%door%' OR lead_source ILIKE '%canvass%') AND assigned_to_user_id IS NOT NULL THEN assigned_to_user_id
            ELSE NULL
          END,
          lead_source_detail = COALESCE(lead_source_detail, lead_source, 'Inbound Inquiry')
      WHERE source_type IS NULL OR source_type = ''
    `);

    // Backfill clients origin and registration tenure from earliest linked lead
    await query(`
      UPDATE clients c
      SET source_type = COALESCE(
            (SELECT l.source_type FROM leads l WHERE l.client_id = c.id ORDER BY l.created_at ASC LIMIT 1),
            c.source_type,
            'website'
          ),
          acquired_by_user_id = COALESCE(
            (SELECT l.created_by_user_id FROM leads l WHERE l.client_id = c.id AND l.created_by_user_id IS NOT NULL ORDER BY l.created_at ASC LIMIT 1),
            c.acquired_by_user_id,
            c.assigned_to_user_id
          ),
          lead_source_detail = COALESCE(
            (SELECT l.lead_source_detail FROM leads l WHERE l.client_id = c.id ORDER BY l.created_at ASC LIMIT 1),
            c.lead_source_detail,
            'Customer Acquisition'
          ),
          client_since = COALESCE(
            (SELECT l.created_at FROM leads l WHERE l.client_id = c.id ORDER BY l.created_at ASC LIMIT 1),
            c.created_at,
            NOW()
          )
      WHERE c.acquired_by_user_id IS NULL OR c.client_since IS NULL
    `);

    // Recalculate stats for all clients
    const allClients = await query<{ id: number }>('SELECT id FROM clients');
    if (allClients.length > 0) {
      const { recalculateClientStats } = await import('@/lib/crm-clients');
      for (const c of allClients) {
        await recalculateClientStats(c.id);
      }
    }

    // Run Pipeline v2 schema migration (checklists, estimate_templates, contracts)
    const { runPipelineV2Migration } = await import('@/lib/schema/pipeline-v2-migration');
    await runPipelineV2Migration();

    return NextResponse.json({ ok: true, message: 'Migrations, RBAC, Client 360, and Pipeline v2 initialization complete' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleMigration(req);
}

export async function GET(req: NextRequest) {
  return handleMigration(req);
}


