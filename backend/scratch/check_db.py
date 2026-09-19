import asyncio
from app.core.database import engine
from sqlalchemy import text

async def main():
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'estimates' ORDER BY ordinal_position"))
            cols = [r[0] for r in res.fetchall()]
            print("DB columns in 'estimates':", cols)
    except Exception as e:
        print("DB connection error:", e)

if __name__ == "__main__":
    asyncio.run(main())
