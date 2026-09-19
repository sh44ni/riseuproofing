"""One-off script to create all database tables from SQLAlchemy models."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.database import get_database_url, Base

# Import all models so Base.metadata knows about them
from app.models import *  # noqa

async def main():
    engine = create_async_engine(get_database_url(), echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("ALL TABLES CREATED SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(main())
