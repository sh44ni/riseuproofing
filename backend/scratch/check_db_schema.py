import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

async def check():
    async with engine.begin() as conn:
        for tbl in ['leads', 'tasks', 'estimates', 'users']:
            res = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{tbl}'"))
            cols = [r[0] for r in res.fetchall()]
            print(f"=== {tbl} columns ({len(cols)}) ===")
            print(", ".join(cols))

if __name__ == "__main__":
    asyncio.run(check())
