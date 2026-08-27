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
];

export async function POST() {
  try {
    for (const sql of MIGRATIONS) {
      await query(sql);
    }
    return NextResponse.json({ ok: true, message: 'Migrations complete' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
