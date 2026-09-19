import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

async def test_create():
    url = "http://127.0.0.1:8000/api/admin/estimates"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw",
    }
    payload = {
        "customerName": "Test Customer",
        "customerPhone": "(760) 555-9999",
        "customerEmail": "test@riseuprac.com",
        "customerAddress": "123 Ocean Blvd",
        "customerCity": "Oceanside, CA",
        "roofSquares": 25,
        "roofPitch": "4:12",
        "stories": 1,
        "templateKey": "multi_option_proposal",
        "proposalData": {
            "proposal_date": "08/27/2026",
            "customer_name": "Test Customer",
            "option_a": {"price": 26870}
        },
        "total": 26870,
        "marginPct": 30,
        "notes": "Testing automated creation",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload, headers=headers)
        print("Status code:", res.status_code)
        print("Response body:", res.text[:200])

if __name__ == "__main__":
    asyncio.run(test_create())
