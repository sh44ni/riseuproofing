import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

async def test_upload():
    url = "http://127.0.0.1:8000/api/admin/estimates/upload-photo"
    headers = {
        "X-API-Key": "rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw",
    }
    # Create 1x1 test png bytes
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {
        "file": ("client_house_test.png", png_bytes, "image/png")
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, files=files, headers=headers)
        print("Status code:", res.status_code)
        data = res.json()
        print("Upload Response:", data)
        assert data.get("ok") is True
        print("[SUCCESS] Client photo uploaded at:", data.get("url"))

if __name__ == "__main__":
    asyncio.run(test_upload())
