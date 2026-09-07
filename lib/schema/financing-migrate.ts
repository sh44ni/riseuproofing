import { query } from '../db';

export async function runFinancingMigration() {
  console.log('Starting Phase 0 Financing Calculator migration...');

  // 1. financing_plans
  await query(`
    CREATE TABLE IF NOT EXISTS financing_plans (
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
    )
  `);

  // 2. financing_settings (singleton row with id = 1)
  await query(`
    CREATE TABLE IF NOT EXISTS financing_settings (
      id                      INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      min_project_cost        NUMERIC(10,2) NOT NULL DEFAULT 5000,
      max_project_cost        NUMERIC(10,2) NOT NULL DEFAULT 50000,
      default_project_cost    NUMERIC(10,2) NOT NULL DEFAULT 16500,
      credit_check_copy_flag  BOOLEAN NOT NULL DEFAULT true,
      updated_at              TIMESTAMPTZ DEFAULT NOW(),
      updated_by              TEXT
    )
  `);

  // 3. financing_calculations (anonymous lead telemetry)
  await query(`
    CREATE TABLE IF NOT EXISTS financing_calculations (
      id              BIGSERIAL PRIMARY KEY,
      plan_id         INT REFERENCES financing_plans(id) ON DELETE SET NULL,
      project_cost    NUMERIC(10,2) NOT NULL,
      down_payment    NUMERIC(10,2) NOT NULL DEFAULT 0,
      monthly_payment NUMERIC(10,2) NOT NULL,
      session_id      TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_financing_calculations_created ON financing_calculations (created_at DESC)`);

  console.log('Financing tables created.');

  // Seed default settings singleton if missing
  const settingsRows = await query('SELECT id FROM financing_settings WHERE id = 1');
  if (settingsRows.length === 0) {
    await query(`
      INSERT INTO financing_settings (id, min_project_cost, max_project_cost, default_project_cost, credit_check_copy_flag, updated_by)
      VALUES (1, 5000, 50000, 16500, true, 'system_seed')
    `);
    console.log('Seeded financing_settings singleton.');
  }

  // Seed default plans if table is empty
  const planRows = await query<{ count: string }>('SELECT COUNT(*) as count FROM financing_plans');
  if (parseInt(planRows[0]?.count || '0', 10) === 0) {
    console.log('Seeding initial financing plans...');
    const defaultPlans = [
      {
        name: '0% APR Same-As-Cash',
        apr: 0,
        term_months: 12,
        min_down_payment_pct: 0,
        is_default: true,
        is_active: true,
        sort_order: 1,
        badge_label: 'Most Popular',
        description: '12 Months zero interest with regular monthly payments. Pay off in 1 year with $0 interest.',
      },
      {
        name: 'Standard Fixed 5-Year',
        apr: 7.99,
        term_months: 60,
        min_down_payment_pct: 0,
        is_default: false,
        is_active: true,
        sort_order: 2,
        badge_label: 'Balanced Rate',
        description: 'Budget-friendly predictable fixed payments over 5 years. No early payoff penalty.',
      },
      {
        name: 'Lowest Payment 10-Year',
        apr: 9.99,
        term_months: 120,
        min_down_payment_pct: 0,
        is_default: false,
        is_active: true,
        sort_order: 3,
        badge_label: 'Lowest Monthly',
        description: 'Long-term financing to keep your monthly overhead as low as possible.',
      },
    ];

    for (const p of defaultPlans) {
      await query(
        `INSERT INTO financing_plans (
           name, apr, term_months, min_down_payment_pct, is_default, is_active, sort_order, badge_label, description
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          p.name,
          p.apr,
          p.term_months,
          p.min_down_payment_pct,
          p.is_default,
          p.is_active,
          p.sort_order,
          p.badge_label,
          p.description,
        ]
      );
    }
    console.log('Seeded financing_plans.');
  }

  console.log('Financing migration and seed complete.');
}

runFinancingMigration()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Financing migration failed:', err);
    process.exit(1);
  });
