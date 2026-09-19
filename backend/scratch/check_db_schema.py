import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

async def check():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'estimates'"))
        rows = res.fetchall()
        for col, dtype in rows:
            print(f"{col}: {dtype}")

if __name__ == "__main__":
    asyncio.run(check())
