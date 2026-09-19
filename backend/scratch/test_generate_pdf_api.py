import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

async def test_pdf_api():
    url = "http://127.0.0.1:8000/api/admin/estimates/generate-pdf"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw",
    }
    payload = {
        "templateKey": "multi_option_proposal",
        "proposalData": {
            "proposal_date": "08/27/2026",
            "customer_name": "David Martinez",
            "customer_phone": "(760) 555-0199",
            "customer_email": "david.martinez@gmail.com",
            "customer_address": "742 Evergreen Terrace",
            "customer_city": "Escondido, CA 92025",
            "roof_squares": 25,
            "roof_pitch": "4:12 Pitch",
            "stories": "1 Story",
            "hero_photo_url": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
            "option_a": {
                "title": "TILE ROOF LIFT & RELAY",
                "subtitle": "REUSE EXISTING TILES",
                "lock_in_price": 26870,
                "standard_price": 31500,
                "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
                "scope_items": [
                    "Remove and carefully stage existing roof tiles for reuse.",
                    "Remove and dispose of existing underlayment.",
                    "Inspect decking and replace up to 3 sheets of plywood as needed."
                ]
            },
            "option_b": {
                "title": "COMPLETE NEW TILE ROOF SYSTEM",
                "subtitle": "100% NEW TILE INSTALLATION",
                "lock_in_price": 32410,
                "standard_price": 37200,
                "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
                "scope_items": [
                    "Remove and dispose of 100% of existing roof tiles.",
                    "Install 100% brand-new roof tiles."
                ]
            },
            "addon_1": {
                "title": "PREMIUM PSU / PEEL-AND-STICK UNDERLAYMENT",
                "description": "Premium self-adhered peel-and-stick system.",
                "price": 2000
            },
            "addon_2": {
                "title": "PRESSURE WASHING ADD-ON",
                "description": "Professional soft wash of roof tiles.",
                "price": 3500
            },
            "lock_in_days": 20
        }
    }

    print("Sending POST request to generate PDF...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, json=payload, headers=headers)
        print("Status code:", res.status_code)
        data = res.json()
        print("Response JSON:", data)
        assert data.get("ok") is True
        print("[SUCCESS] PDF generated via API at:", data.get("pdfUrl"))

if __name__ == "__main__":
    asyncio.run(test_pdf_api())
