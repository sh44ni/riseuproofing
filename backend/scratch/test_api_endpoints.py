import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

async def test_api():
    print("Testing DB record insertion with new columns...")
    async with engine.begin() as conn:
        res = await conn.execute(
            text("""
                INSERT INTO estimates (
                    estimate_number, status, customer_name, service_type,
                    roof_squares, roof_pitch, stories, tearoff_layers,
                    material_type, material_cost, labor_cost, subtotal,
                    margin_pct, total, template_key, proposal_data, pdf_url
                ) VALUES (
                    'TEST-EST-2026-9999', 'draft', 'Test Martinez', 'Residential Roofing',
                    25, '4:12', 1, 1, 'Tile', 7200, 8500, 15700, 30.0, 26870,
                    'multi_option_proposal', '{"option_a": {"price": 26870}}'::jsonb, '/static/uploads/estimates/test.pdf'
                ) RETURNING id, estimate_number, template_key, proposal_data, pdf_url
            """)
        )
        row = res.first()
        print("[SUCCESS] Inserted test estimate ID:", row[0])
        print("  Estimate Number:", row[1])
        print("  Template Key:", row[2])
        print("  Proposal Data:", row[3])
        print("  PDF URL:", row[4])

        # Clean up test row
        await conn.execute(text("DELETE FROM estimates WHERE id = :id"), {"id": row[0]})
        print("[SUCCESS] Cleaned up test estimate row.")

if __name__ == "__main__":
    asyncio.run(test_api())
