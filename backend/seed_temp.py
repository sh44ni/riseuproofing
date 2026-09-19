import asyncio, sys, os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, '.')
os.environ.setdefault("ENV", "development")

async def main():
    from app.core.database import async_session_factory
    from sqlalchemy import text

    NOW = datetime.now(timezone.utc)

    leads = [
        {"form_type": "crm_manual", "full_name": "Maria Santos", "phone": "(760) 555-0101", "email": "maria.santos@gmail.com", "address": "1420 Oceanside Blvd", "city": "Oceanside", "zip": "92054", "service_type": "Shingle Roof", "status": "new", "pipeline_stage": "stage_1_lead_gen", "lead_source": "google_ads", "estimated_value": 18500.00, "priority": "warm"},
        {"form_type": "crm_manual", "full_name": "Kevin OBrien", "phone": "(760) 555-0102", "email": "kobrien@carlsbad.net", "address": "935 Elm Ave", "city": "Carlsbad", "zip": "92008", "service_type": "Tile Roofing", "status": "new", "pipeline_stage": "stage_1_lead_gen", "lead_source": "referral", "estimated_value": 26000.00, "priority": "hot"},
        {"form_type": "crm_manual", "full_name": "Priya Nair", "phone": "(760) 555-0103", "email": "p.nair@vista.org", "address": "308 Harbor Dr", "city": "Vista", "zip": "92083", "service_type": "Roof Repair", "status": "new", "pipeline_stage": "stage_1_lead_gen", "lead_source": "website", "estimated_value": 7200.00, "priority": "cool"},
        {"form_type": "crm_manual", "full_name": "Doug Ramirez", "phone": "(760) 555-0201", "email": "d.ramirez@gmail.com", "address": "2240 Terrace Way", "city": "Oceanside", "zip": "92056", "service_type": "Commercial Flat", "status": "contacted", "pipeline_stage": "stage_2_initial_contact", "lead_source": "yelp", "estimated_value": 42000.00, "priority": "hot", "initial_contacted_at": NOW - timedelta(days=1)},
        {"form_type": "crm_manual", "full_name": "Lisa Tran", "phone": "(760) 555-0202", "email": "lisa.tran@cox.net", "address": "714 Sunset Dr", "city": "Encinitas", "zip": "92024", "service_type": "Shingle Reroof", "status": "contacted", "pipeline_stage": "stage_2_initial_contact", "lead_source": "door_to_door", "estimated_value": 21000.00, "priority": "warm", "initial_contacted_at": NOW - timedelta(days=2)},
        {"form_type": "crm_manual", "full_name": "Marcus Johnson", "phone": "(760) 555-0301", "email": "marcus.j@gmail.com", "address": "4820 Mesa Dr", "city": "Oceanside", "zip": "92057", "service_type": "Tile Reroof", "status": "contacted", "pipeline_stage": "stage_3_site_visit_estimate", "lead_source": "google_ads", "estimated_value": 34500.00, "priority": "hot", "initial_contacted_at": NOW - timedelta(days=3), "site_visit_scheduled_at": NOW - timedelta(days=1)},
        {"form_type": "crm_manual", "full_name": "Helena Park", "phone": "(760) 555-0302", "email": "h.park@poway.gov", "address": "1155 Poway Rd", "city": "Poway", "zip": "92064", "service_type": "Metal Roof", "status": "contacted", "pipeline_stage": "stage_3_site_visit_estimate", "lead_source": "referral", "estimated_value": 51000.00, "priority": "warm", "initial_contacted_at": NOW - timedelta(days=5), "site_visit_scheduled_at": NOW - timedelta(days=2)},
        {"form_type": "crm_manual", "full_name": "Andre Williams", "phone": "(760) 555-0401", "email": "awilliams@escondido.com", "address": "2980 Del Lago Dr", "city": "Escondido", "zip": "92029", "service_type": "Shingle Roof", "status": "contacted", "pipeline_stage": "stage_3_site_visit_estimate", "lead_source": "website", "estimated_value": 67000.00, "priority": "hot", "initial_contacted_at": NOW - timedelta(days=7), "site_visit_scheduled_at": NOW - timedelta(days=4), "site_visit_completed_at": NOW - timedelta(days=4), "proposal_sent_at": NOW - timedelta(days=2)},
        {"form_type": "crm_manual", "full_name": "Rachel Bloom", "phone": "(760) 555-0501", "email": "rbloom@oceanside.com", "address": "603 N Pacific St", "city": "Oceanside", "zip": "92054", "service_type": "Tile Roof + Solar", "status": "closed", "pipeline_stage": "stage_4_closing", "lead_source": "referral", "estimated_value": 89000.00, "priority": "hot", "initial_contacted_at": NOW - timedelta(days=14), "site_visit_scheduled_at": NOW - timedelta(days=11), "site_visit_completed_at": NOW - timedelta(days=11), "proposal_sent_at": NOW - timedelta(days=8), "contract_signed_at": NOW - timedelta(days=3)},
        {"form_type": "crm_manual", "full_name": "Tom Harrington", "phone": "(760) 555-0601", "email": "t.harrington@gmail.com", "address": "1800 Hill St", "city": "Vista", "zip": "92084", "service_type": "Roof Repair", "status": "lost", "pipeline_stage": "stage_1_lead_gen", "lead_source": "yelp", "estimated_value": 5500.00, "priority": "cool"},
    ]

    jobs_data = [
        ("Rachel Bloom",   "603 N Pacific St",  "Oceanside", "92054", "Tile Roof + Solar", 89000),
        ("Marcus Johnson", "4820 Mesa Dr",       "Oceanside", "92057", "Tile Reroof",       34500),
        ("Helena Park",    "1155 Poway Rd",      "Poway",     "92064", "Metal Roof",        51000),
        ("Andre Williams", "2980 Del Lago Dr",   "Escondido", "92029", "Shingle Roof",      67000),
    ]

    crew_data = [
        ("Carlos Morales", "(760) 555-1001", "foreman"),
        ("Hector Rios",    "(760) 555-1002", "roofer"),
        ("Juan Espinoza",  "(760) 555-1003", "roofer"),
        ("Tony Salinas",   "(760) 555-1004", "laborer"),
        ("Mike Patterson", "(760) 555-1005", "estimator"),
    ]

    async with async_session_factory() as session:
        for i, lead in enumerate(leads):
            cols = [k for k in lead if lead[k] is not None]
            vals = {k: lead[k] for k in cols}
            placeholders = ", ".join(f":{k}" for k in cols)
            col_str = ", ".join(cols)
            await session.execute(text(f"INSERT INTO leads ({col_str}) VALUES ({placeholders})"), vals)
        print(f"Inserted {len(leads)} leads")

        for i, (name, addr, city, zcode, svc, val) in enumerate(jobs_data):
            await session.execute(text(
                "INSERT INTO jobs (job_number, status, customer_name, address, city, zip, service_type, contract_value, permit_status, material_status) "
                "VALUES (:jn, 'in_progress', :name, :addr, :city, :zip, :svc, :val, 'approved', 'delivered')"
            ), {"jn": f"RUP-2026-{1001+i}", "name": name, "addr": addr, "city": city, "zip": zcode, "svc": svc, "val": val})
        print(f"Inserted {len(jobs_data)} jobs")

        for name, phone, role in crew_data:
            await session.execute(text(
                "INSERT INTO crew_members (name, phone, role, active) VALUES (:n, :p, :r, true)"
            ), {"n": name, "p": phone, "r": role})
        print(f"Inserted {len(crew_data)} crew members")

        await session.commit()
        print("Seed complete!")

asyncio.run(main())
