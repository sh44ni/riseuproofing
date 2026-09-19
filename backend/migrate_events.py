import asyncio
from app.core.database import async_session_factory
from sqlalchemy import text

async def update_events():
    async with async_session_factory() as session:
        # 1. Update evt-b667d17f (Sep 15) -> Marco Silva (Field Foreman)
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 4,
                crew_name = 'Marco Silva',
                foreman_name = 'Field Foreman',
                foreman_phone = '(760) 555-0198'
            WHERE id = 'evt-b667d17f' OR date = '2026-09-15'
        """))

        # 2. Update evt-3b320af0 (Sep 16) -> Carlos Ramirez (Project Manager)
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 2,
                crew_name = 'Carlos Ramirez',
                foreman_name = 'Project Manager',
                foreman_phone = '(760) 555-0142'
            WHERE id = 'evt-3b320af0' OR date = '2026-09-16'
        """))

        # 3. Update evt-83b9bb61 (Sep 17) -> Jessica Hayes (Senior Estimator)
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 3,
                crew_name = 'Jessica Hayes',
                foreman_name = 'Senior Estimator',
                foreman_phone = '(760) 555-0211'
            WHERE id = 'evt-83b9bb61' OR date = '2026-09-17'
        """))

        # 4. Update evt-71e915de (Sep 18) -> Sam Martinez (Owner & Executive)
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 1,
                crew_name = 'Sam Martinez',
                foreman_name = 'Owner & Executive',
                foreman_phone = '(760) 555-0100'
            WHERE id = 'evt-71e915de' OR date = '2026-09-18'
        """))

        # 5. Update evt-e596af21 (Sep 20) -> Carlos Ramirez (Project Manager)
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 2,
                crew_name = 'Carlos Ramirez',
                foreman_name = 'Project Manager',
                foreman_phone = '(760) 555-0142'
            WHERE id = 'evt-e596af21' OR date = '2026-09-20'
        """))

        # 6. Update any remaining rows with 'Crew' or NULL user_id -> Marco Silva
        await session.execute(text("""
            UPDATE crm_calendar_events
            SET assigned_to_user_id = 4,
                crew_name = 'Marco Silva',
                foreman_name = 'Field Foreman',
                foreman_phone = '(760) 555-0198'
            WHERE assigned_to_user_id IS NULL 
               OR crew_name ILIKE '%crew%'
               OR foreman_name ILIKE '%miguel%'
        """))

        await session.commit()
        print('SUCCESS: Updated legacy database events to registered CRM accounts!')

if __name__ == '__main__':
    asyncio.run(update_events())
