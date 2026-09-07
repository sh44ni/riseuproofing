import { query } from '../db';

export async function runEstimatorMigration() {
  console.log('Starting Phase 0 Estimator migration...');

  // 1. estimator_services
  await query(`
    CREATE TABLE IF NOT EXISTS estimator_services (
      id           SERIAL PRIMARY KEY,
      slug         TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      short_label  TEXT NOT NULL,
      icon_key     TEXT NOT NULL,
      badge_label  TEXT,
      sort_order   INT NOT NULL DEFAULT 0,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 2. estimator_pricing_rules
  await query(`
    CREATE TABLE IF NOT EXISTS estimator_pricing_rules (
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
    )
  `);

  // 3. estimator_size_presets
  await query(`
    CREATE TABLE IF NOT EXISTS estimator_size_presets (
      id          SERIAL PRIMARY KEY,
      service_id  INT REFERENCES estimator_services(id) ON DELETE CASCADE,
      label       TEXT NOT NULL,
      sqft_value  INT NOT NULL,
      sort_order  INT NOT NULL DEFAULT 0
    )
  `);

  // 4. estimator_leads
  await query(`
    CREATE TABLE IF NOT EXISTS estimator_leads (
      id             BIGSERIAL PRIMARY KEY,
      service_id     INT REFERENCES estimator_services(id) ON DELETE SET NULL,
      sqft_entered   INT NOT NULL,
      estimate_low   NUMERIC(10,2) NOT NULL,
      estimate_high  NUMERIC(10,2) NOT NULL,
      source         TEXT NOT NULL CHECK (source IN ('preset', 'custom')),
      session_id     TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_estimator_leads_created ON estimator_leads (created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_estimator_pricing_service ON estimator_pricing_rules (service_id)`);

  console.log('Tables created successfully.');

  // Seed default services if empty
  const existingServices = await query<{ count: string }>('SELECT COUNT(*) as count FROM estimator_services');
  if (parseInt(existingServices[0]?.count || '0', 10) === 0) {
    console.log('Seeding initial estimator services and pricing rules...');

    const defaultServices = [
      {
        slug: 'residential',
        name: 'Tile / Shingle Roof',
        short_label: 'Tile / Shingle',
        icon_key: 'home',
        badge_label: 'Popular',
        sort_order: 1,
        pricing: {
          price_per_sqft_low: 4.00,
          price_per_sqft_high: 6.20,
          base_fee_low: 500,
          base_fee_high: 950,
          min_sqft: 800,
          max_sqft: 8000,
          apr_available: true,
          financing_apr: 0,
          financing_term_months: 60,
        },
      },
      {
        slug: 'repair',
        name: 'Leak & Tile Repair',
        short_label: 'Leak & Repair',
        icon_key: 'wrench',
        badge_label: 'Same-Day',
        sort_order: 2,
        pricing: {
          price_per_sqft_low: 0.40,
          price_per_sqft_high: 0.80,
          base_fee_low: 100,
          base_fee_high: 600,
          min_sqft: 500,
          max_sqft: 8000,
          apr_available: true,
          financing_apr: 0,
          financing_term_months: 18,
        },
      },
      {
        slug: 'commercial',
        name: 'Commercial Flat Roof',
        short_label: 'Commercial Flat',
        icon_key: 'building',
        badge_label: 'TPO / BUR',
        sort_order: 3,
        pricing: {
          price_per_sqft_low: 5.00,
          price_per_sqft_high: 8.00,
          base_fee_low: 2250,
          base_fee_high: 4000,
          min_sqft: 1000,
          max_sqft: 15000,
          apr_available: true,
          financing_apr: 0,
          financing_term_months: 60,
        },
      },
      {
        slug: 'solar',
        name: 'Solar + Roofing',
        short_label: 'Solar + Roof',
        icon_key: 'sun',
        badge_label: 'Save 30%',
        sort_order: 4,
        pricing: {
          price_per_sqft_low: 7.00,
          price_per_sqft_high: 10.00,
          base_fee_low: 2750,
          base_fee_high: 4500,
          min_sqft: 800,
          max_sqft: 8000,
          apr_available: true,
          financing_apr: 0,
          financing_term_months: 120,
        },
      },
    ];

    for (const s of defaultServices) {
      const serviceRes = await query<{ id: number }>(
        `INSERT INTO estimator_services (slug, name, short_label, icon_key, badge_label, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [s.slug, s.name, s.short_label, s.icon_key, s.badge_label, s.sort_order]
      );

      const serviceId = serviceRes[0].id;
      const p = s.pricing;

      await query(
        `INSERT INTO estimator_pricing_rules (
           service_id, price_per_sqft_low, price_per_sqft_high, base_fee_low, base_fee_high,
           min_sqft, max_sqft, apr_available, financing_apr, financing_term_months, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'system_seed')`,
        [
          serviceId,
          p.price_per_sqft_low,
          p.price_per_sqft_high,
          p.base_fee_low,
          p.base_fee_high,
          p.min_sqft,
          p.max_sqft,
          p.apr_available,
          p.financing_apr,
          p.financing_term_months,
        ]
      );
    }

    // Seed global size presets (service_id = null means applies to all)
    const defaultPresets = [
      { label: '< 2,000 sq ft', sqft_value: 1750, sort_order: 1 },
      { label: '2,000 – 3,500 sq ft', sqft_value: 2750, sort_order: 2 },
      { label: '3,500+ sq ft', sqft_value: 4250, sort_order: 3 },
    ];

    for (const preset of defaultPresets) {
      await query(
        `INSERT INTO estimator_size_presets (service_id, label, sqft_value, sort_order)
         VALUES (NULL, $1, $2, $3)`,
        [preset.label, preset.sqft_value, preset.sort_order]
      );
    }

    console.log('Estimator seeding complete.');
  } else {
    console.log('Estimator services already seeded.');
  }
}

runEstimatorMigration()
  .then(() => {
    console.log('Migration finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
