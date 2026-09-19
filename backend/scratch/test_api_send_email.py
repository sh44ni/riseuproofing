import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

async def test_api_email():
    url = "http://127.0.0.1:8000/api/admin/estimates/send-email"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw",
    }
    payload = {
        "customerEmail": "delivered@resend.dev",
        "customerName": "Christian Lavalle",
        "estimateNumber": "EST-2026-9876",
        "templateKey": "multi_option_proposal",
        "proposalData": {
            "proposal_date": "08/27/2026",
            "customer_name": "Christian Lavalle",
            "customer_phone": "(760) 212-5590",
            "customer_email": "delivered@resend.dev",
            "customer_address": "2940 Luana Dr",
            "customer_city": "San Diego, CA 92056",
            "roof_squares": 12,
            "roof_pitch": "4:12 Pitch",
            "stories": "1 Story",
            "hero_photo_url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "option_a": {
                "title": "TILE ROOF LIFT & RELAY",
                "subtitle": "REUSE EXISTING TILES",
                "lock_in_price": 16500,
                "standard_price": 19500,
                "warranty": "10 YEAR WORKMANSHIP",
                "scope_items": ["Stage and reuse tiles", "Replace underlayment"]
            },
            "option_b": {
                "title": "COMPLETE NEW TILE ROOF",
                "subtitle": "100% NEW TILES",
                "lock_in_price": 22400,
                "standard_price": 25800,
                "warranty": "10 YEAR WORKMANSHIP",
                "scope_items": ["100% new tiles", "Full waterproofing shield"]
            },
            "addon_1": {
                "title": "PREMIUM PSU UNDERLAYMENT",
                "description": "Peel and stick barrier",
                "price": 2000
            },
            "addon_2": {
                "title": "PRESSURE WASHING ADD-ON",
                "description": "Soft wash",
                "price": 3500
            },
            "lock_in_days": 20
        },
        "subject": "Your Official Roofing Estimate - Rise Up Roofing & Construction",
        "message": "Hi Christian, here is your 2-page estimate proposal as requested!"
    }

    print("Posting to send-email endpoint...")
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(url, json=payload, headers=headers)
        print("Status code:", res.status_code)
        print("Response JSON:", res.json())
        assert res.json().get("ok") is True

if __name__ == "__main__":
    asyncio.run(test_api_email())
