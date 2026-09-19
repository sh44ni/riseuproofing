"""Script to seed owner and developer users, plus default API key into the database."""
import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.database import get_database_url
from app.core.security import hash_scrypt_password

DEFAULT_CRM_API_KEY = "rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw"

async def main():
    engine = create_async_engine(get_database_url())

    access_hash, access_salt = hash_scrypt_password("access")

    users_to_seed = [
        {
            "name": "Developer Admin",
            "email": "developer@riseuprac.com",
            "phone": "(760) 555-0199",
            "hash": access_hash,
            "salt": access_salt,
            "role": "owner",
        },
        {
            "name": "System Admin",
            "email": "admin@riseuprac.com",
            "phone": "(760) 555-0100",
            "hash": access_hash,
            "salt": access_salt,
            "role": "owner",
        },
        {
            "name": "Marc Sarellano",
            "email": "marc@riseuprac.com",
            "phone": "(760) 555-0101",
            "hash": access_hash,
            "salt": access_salt,
            "role": "owner",
        },
    ]

    async with engine.begin() as conn:
        for u in users_to_seed:
            row = (await conn.execute(text("SELECT id FROM users WHERE LOWER(email) = LOWER(:email)"), {"email": u["email"]})).first()
            if row:
                print(f"User {u['email']} already exists (id={row[0]}), updating password...")
                await conn.execute(text("""
                    UPDATE users
                    SET password_hash = :hash, salt = :salt, role = :role, status = 'active'
                    WHERE id = :id
                """), {"hash": u["hash"], "salt": u["salt"], "role": u["role"], "id": row[0]})
            else:
                await conn.execute(text("""
                    INSERT INTO users (name, email, phone, password_hash, salt, role, status, permissions)
                    VALUES (:name, :email, :phone, :hash, :salt, :role, 'active', '{}')
                """), u)
                print(f"USER CREATED: {u['email']} (role: {u['role']})")

        # Seed CRM Web Frontend API Key
        raw_key = DEFAULT_CRM_API_KEY
        key_prefix = raw_key[:12]
        last_four = raw_key[-4:]
        key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

        key_row = (await conn.execute(text("SELECT id FROM api_keys WHERE key_hash = :h"), {"h": key_hash})).first()
        if not key_row:
            await conn.execute(text("""
                INSERT INTO api_keys (name, key_prefix, key_hash, last_four, environment, scopes, rate_limit_per_minute, allowed_origins, is_active, total_requests)
                VALUES ('CRM Web Frontend', :kp, :kh, :lf, 'live', '["*"]', 1000, '["*"]', true, 0)
            """), {"kp": key_prefix, "kh": key_hash, "lf": last_four})
            print(f"API KEY SEEDED: {key_prefix}...{last_four}")
        else:
            print(f"API KEY ALREADY ACTIVE (id={key_row[0]})")

    await engine.dispose()
    print("SEED COMPLETE: Users and API Key ready")

if __name__ == "__main__":
    asyncio.run(main())
