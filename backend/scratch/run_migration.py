import asyncio
from app.core.database import engine
from sqlalchemy import text

async def main():
    statements = [
        "ALTER TABLE estimates ADD COLUMN IF NOT EXISTS template_key TEXT DEFAULT 'multi_option_proposal';",
        "ALTER TABLE estimates ADD COLUMN IF NOT EXISTS proposal_data JSONB;",
        "ALTER TABLE estimates ADD COLUMN IF NOT EXISTS pdf_url TEXT;",
    ]
    async with engine.begin() as conn:
        for stmt in statements:
            print(f"Executing: {stmt}")
            await conn.execute(text(stmt))
    print("Migration successfully applied!")

    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'estimates' AND column_name IN ('template_key', 'proposal_data', 'pdf_url')"))
        for row in res.fetchall():
            print(f"Verified Column: {row[0]} ({row[1]})")

if __name__ == "__main__":
    asyncio.run(main())
