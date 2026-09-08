import { query } from '../db';

export async function runPipelineV2Migration() {
  console.log('[PipelineV2 Migration] Starting migration...');

  // 1. lead_stage_checklists
  await query(`
    CREATE TABLE IF NOT EXISTS lead_stage_checklists (
      id            SERIAL PRIMARY KEY,
      lead_id       BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      stage         TEXT NOT NULL,
      item_key      TEXT NOT NULL,
      completed     BOOLEAN NOT NULL DEFAULT false,
      completed_by  BIGINT REFERENCES users(id),
      completed_at  TIMESTAMPTZ,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_lead_stage_checklist_item UNIQUE (lead_id, stage, item_key)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_lead_stage_checklists_lead ON lead_stage_checklists (lead_id, stage)`);

  // 2. estimate_templates
  await query(`
    CREATE TABLE IF NOT EXISTS estimate_templates (
      id                        SERIAL PRIMARY KEY,
      template_key              TEXT UNIQUE NOT NULL,
      name                      TEXT NOT NULL,
      service_type              TEXT NOT NULL,
      description               TEXT,
      budget_tier_name          TEXT NOT NULL,
      budget_material_details   TEXT NOT NULL,
      budget_scope_of_work      TEXT NOT NULL,
      premium_tier_name         TEXT NOT NULL,
      premium_material_details  TEXT NOT NULL,
      premium_scope_of_work     TEXT NOT NULL,
      price_multiplier_budget   NUMERIC(5,2) NOT NULL DEFAULT 1.00,
      price_multiplier_premium  NUMERIC(5,2) NOT NULL DEFAULT 1.25,
      warranty_years            INT NOT NULL DEFAULT 50,
      sort_order                INT NOT NULL DEFAULT 0,
      is_active                 BOOLEAN NOT NULL DEFAULT true,
      created_at                TIMESTAMPTZ DEFAULT NOW(),
      updated_at                TIMESTAMPTZ DEFAULT NOW(),
      updated_by                TEXT
    )
  `);

  // Seed default 5 service templates if empty
  const estTemplatesCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM estimate_templates');
  if (parseInt(estTemplatesCount[0]?.count || '0', 10) === 0) {
    console.log('[PipelineV2 Migration] Seeding 5 official estimate templates...');

    const defaultTemplates = [
      {
        key: 'full_reroof_tile',
        name: 'Full Reroof (Tile)',
        service_type: 'Tile Roof Replacement',
        description: 'Complete tile removal, inspection of decking, brand-new underlayment, and relay/new tile install.',
        budget_tier: 'Standard / ASTM Synthetic Felt Underlayment',
        budget_mat: 'ASTM D226 Grade Type II heavy asphalt synthetic felt, 26-gauge galvanized steel flashings, new bird stop eave risers, standard concrete S-tile or flat tile replacement.',
        budget_scope: `1. Strip existing roof tiles down to substrate and salvage sound field units.
2. Inspect entire wood decking for dry rot or sagging rafters; replace damaged plywood up to 2 sheets included.
3. Install heavy-duty ASTM synthetic underlayment over entire roof deck with 4" head laps and 6" end laps.
4. Install brand-new 26-gauge galvanized valley metal, eave metal, and perimeter drip edge.
5. Re-lay salvaged field tiles and install new matching hip/ridge tiles set in colored mortar with weather-resistant bond.
6. Install custom eave bird-stop closures along entire perimeter to prevent pest and water entry.
7. Clean gutters, magnetic sweep perimeter for fasteners, and haul away all construction debris.`,
        premium_tier: 'Premium / Double-Layer Titanium PSU30 Self-Adhering Underlayment',
        premium_mat: 'Titanium® PSU30 high-temp self-adhering modified bitumen underlayment, pre-painted aluminum or copper flashings, Eagle concrete or authentic Spanish barrel clay tile, lifetime mortar bond.',
        premium_scope: `1. Remove all existing roof tiles down to bare wood deck; salvage reusable field tiles or stage new premium tile.
2. Complete 100% deck inspection with photographic documentation; repair dry rot framing/sheathing as required.
3. Install dual-layer Titanium® PSU30 self-adhering high-temperature underlayment providing 100% watertight seal around all penetrations.
4. Install heavy-gauge baked-enamel drip edge, heavy valley pans, and step flashings with polyurethane sealant.
5. Install solid wood battens for enhanced ventilation, airflow, and thermal barrier efficiency.
6. Precision install concrete/clay tile system with mechanical fasteners and reinforced hip/ridge mortar bed with flex-seal additive.
7. Install heavy-duty galvanized bird stops and pest guards at all eave intersections.
8. Ground-to-eave magnetic nail sweep, gutter flush, and haul-away with Rise Up 50-Year Golden Workmanship Warranty certificate.`,
        mult_budget: 1.00,
        mult_premium: 1.30,
        warranty: 50,
        sort: 1,
      },
      {
        key: 'repair_tile',
        name: 'Repair (Tile)',
        service_type: 'Tile Roof Leak Repair',
        description: 'Targeted tile lift, valley clearing, localized underlayment replacement, broken tile swap, and re-mortaring.',
        budget_tier: 'Standard Tile Reset & Leak Stop',
        budget_mat: 'ASTM #30 asphalt felt underlayment patch, elastomeric roofing cement, replacement matching concrete tiles.',
        budget_scope: `1. Carefully remove field tiles in targeted leak area (approx 100-200 sq ft).
2. Clean out accumulated dirt, silt, leaves, and debris clogging water channel corridors.
3. Cut back deteriorated underlayment to sound wood; apply ASTM felt underlayment patch laps.
4. Replace up to 15 cracked or broken tiles with matching profiles.
5. Re-secure lifted tiles with weather-resistant roofing mastic and mechanical clips.
6. Clean gutters adjacent to repair area and perform water flow test to verify water-tightness.`,
        premium_tier: 'Comprehensive Valley & Transition Rebuild (Titanium Underlayment)',
        premium_mat: 'Titanium® PSU30 peel-and-stick high-temp underlayment, new 26-gauge valley metal, replacement matching tiles, colored mortar pack.',
        premium_scope: `1. Strip tiles along entire affected valley, wall, or chimney transition (approx 250-400 sq ft).
2. Inspect wood decking for structural dry rot or hidden leaks; reinforce decking as needed.
3. Install full-width Titanium® PSU30 self-adhering waterproof membrane over entire transition.
4. Install brand-new heavy gauge baked-enamel valley metal with hemmed splash-diverter ribs.
5. Replace all damaged tiles with new color-matched units; re-cut valley diagonal tiles for clean uniform reveal.
6. Seal all penetrations, pipes, and headwalls with high-grade commercial polyurethane sealant.
7. 2-Year Rise Up Workmanship Warranty on repaired roof section.`,
        mult_budget: 1.00,
        mult_premium: 1.25,
        warranty: 10,
        sort: 2,
      },
      {
        key: 'full_reroof_shingle',
        name: 'Full Reroof (Shingle)',
        service_type: 'Shingle Roof Replacement',
        description: 'Complete tear-off down to wood deck, new ice & water shield, synthetic underlayment, and lifetime architectural shingles.',
        budget_tier: 'Standard / 30-Year Architectural Shingle',
        budget_mat: 'Owens Corning Oakridge® architectural shingles, synthetic underlayment, aluminum drip edge, starter strip, and ridge cap shingles.',
        budget_scope: `1. Tear off existing layers of roofing down to original wood sheathing.
2. Inspect decking for loose or rotted boards; replace up to 64 sq ft (2 sheets) of plywood.
3. Install continuous synthetic underlayment across entire roof deck with mechanical cap nails.
4. Install 26-gauge galvanized eave and rake drip edge metals around complete perimeter.
5. Install starter shingles along all eaves and rakes for certified wind resistance up to 110 MPH.
6. Install 30-year architectural dimensional shingles using 6 nails per shingle.
7. Install high-profile ridge cap shingles along all hips and ridges.
8. Install new plumbing vent pipe flashings and reseal with polyurethane.
9. Full ground cleanup and magnetic sweep for nails.`,
        premium_tier: 'Premium / Owens Corning TruDefinition® Duration® 50-Year System',
        premium_mat: 'Owens Corning Duration® with SureNail® Technology, WeatherLock® Ice & Water Barrier in valleys and eaves, ProArmor® synthetic underlayment, RIZERidge® hip & ridge.',
        premium_scope: `1. Complete tear-off of all roof layers down to structural plywood decking.
2. Re-nail entire wood substrate to current seismic building code specifications.
3. Install Owens Corning WeatherLock® self-adhering ice & water barrier in all valleys, flashings, and along eaves.
4. Install Owens Corning ProArmor® synthetic underlayment across all remaining deck surfaces.
5. Install heavy-gauge baked-enamel perimeter drip edge metals.
6. Install Owens Corning Starter Strip Plus along all eaves and rake edges.
7. Install Owens Corning TruDefinition® Duration® shingles with patented SureNail® triple-layer reinforcement (130 MPH wind warranty).
8. Install high-profile RIZERidge® hip and ridge caps for dramatic curb appeal.
9. Install new O'Hagin low-profile attic ventilation units and new neoprene-free lead plumbing boots.
10. Rise Up Roofing 50-Year Lifetime Preferred Protection non-prorated manufacturer warranty certificate.`,
        mult_budget: 1.00,
        mult_premium: 1.25,
        warranty: 50,
        sort: 3,
      },
      {
        key: 'repair_shingle',
        name: 'Repair (Shingle)',
        service_type: 'Shingle Roof Leak Repair',
        description: 'Torn shingle replacement, pipe collar resealing, step flashing reset, and storm damage repair.',
        budget_tier: 'Targeted Shingle Patch & Pipe Reseal',
        budget_mat: 'Matching architectural shingles, roofing sealant, replacement neoprene vent pipe collars.',
        budget_scope: `1. Identify source of active leak or wind blow-off damage.
2. Remove damaged, torn, or unsealed shingles in the repair area.
3. Install synthetic underlayment patch and apply roofing adhesive.
4. Install new color-matched architectural shingles secured with code-compliant nail placement.
5. Reseal or replace deteriorated plumbing jack boot gaskets.
6. Reseal exposed nail heads with UV-resistant black roofing mastic.`,
        premium_tier: 'Comprehensive Slope Restoration & Flashing Rebuild',
        premium_mat: 'Owens Corning WeatherLock® self-adhering membrane, matching Duration® shingles, new galvanized step and counter flashings, lead pipe boots.',
        premium_scope: `1. Strip affected slope or roof section (up to 200 sq ft) down to wood sheathing.
2. Inspect wood decking and replace water-damaged sheathing.
3. Install self-adhering WeatherLock® waterproof membrane across entire repair zone.
4. Install new heavy-gauge metal wall step flashings and counter-flash with polyurethane sealant.
5. Tie in new Owens Corning Duration® shingles seamlessly into surrounding roof slopes.
6. Install permanent lead plumbing roof boots with 50-year UV lifespan.
7. 2-Year Rise Up Leak-Free Workmanship Warranty on repaired area.`,
        mult_budget: 1.00,
        mult_premium: 1.25,
        warranty: 10,
        sort: 4,
      },
      {
        key: 'general_repair',
        name: 'General Roof Repair',
        service_type: 'General Roof Maintenance & Repair',
        description: 'Flashing reseal, gutter tune-up, skylight flashing kit replacement, fascia board repair, and storm prep.',
        budget_tier: 'Standard Maintenance & Seal Tune-Up',
        budget_mat: 'Commercial polyurethane roofing sealant, fasteners, chimney counter-flashing touch-up, debris clearing.',
        budget_scope: `1. Comprehensive roof inspection to locate all potential leak vulnerabilities.
2. Clean all debris from valleys, scuppers, and gutter corridors to restore positive drainage.
3. Reseal all roof pipe penetrations, skylight frames, and chimney flashings with polyurethane sealant.
4. Secure any loose flashings, rake metal trims, or perimeter edge caps.
5. Re-secure lifted shingles or loose roof tiles throughout entire roof surface.`,
        premium_tier: 'Heavy-Duty Flashing & Dry-Rot Restoration',
        premium_mat: 'Primed exterior fascia wood, custom sheet metal flashings, commercial elastomeric coatings, skylight flashing kit.',
        premium_scope: `1. Remove deteriorated fascia board, starter board, or eave framing exhibiting dry rot or decay (up to 16 linear feet).
2. Install new primed exterior-grade lumber and secure with galvanized structural fasteners.
3. Replace cracked or aged skylight flashing assemblies with new factory pre-engineered flashing kits.
4. Re-flash chimney cricket or major wall transitions with commercial-grade sheet metal and polyurethane.
5. Full cleaning of all gutters and downspouts with water pressure flush test.
6. 2-Year Rise Up Workmanship Warranty on all restored components.`,
        mult_budget: 1.00,
        mult_premium: 1.30,
        warranty: 15,
        sort: 5,
      },
    ];

    for (const t of defaultTemplates) {
      await query(
        `INSERT INTO estimate_templates (
           template_key, name, service_type, description,
           budget_tier_name, budget_material_details, budget_scope_of_work,
           premium_tier_name, premium_material_details, premium_scope_of_work,
           price_multiplier_budget, price_multiplier_premium, warranty_years, sort_order, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'system_seed')`,
        [
          t.key,
          t.name,
          t.service_type,
          t.description,
          t.budget_tier,
          t.budget_mat,
          t.budget_scope,
          t.premium_tier,
          t.premium_mat,
          t.premium_scope,
          t.mult_budget,
          t.mult_premium,
          t.warranty,
          t.sort,
        ]
      );
    }
    console.log('[PipelineV2 Migration] Seeded 5 estimate templates.');
  }

  // 3. contracts table
  await query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id                  SERIAL PRIMARY KEY,
      lead_id             BIGINT REFERENCES leads(id) ON DELETE CASCADE,
      estimate_id         BIGINT REFERENCES estimates(id) ON DELETE CASCADE,
      job_id              BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
      contract_number     TEXT UNIQUE NOT NULL,
      status              TEXT NOT NULL CHECK (status IN ('action_required', 'client_signed', 'fully_executed')),
      client_signed_at    TIMESTAMPTZ,
      counter_signed_at   TIMESTAMPTZ,
      counter_signed_by   BIGINT REFERENCES users(id),
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_contracts_lead ON contracts (lead_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_contracts_estimate ON contracts (estimate_id)`);

  // 4. extend job_photos with lead_id if not present
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_photos' AND column_name = 'lead_id'
      ) THEN
        ALTER TABLE job_photos ADD COLUMN lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE;
        CREATE INDEX idx_job_photos_lead ON job_photos (lead_id);
      END IF;
    END $$;
  `);

  console.log('[PipelineV2 Migration] Pipeline v2 migration completed successfully.');
}
