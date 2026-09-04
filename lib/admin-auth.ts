import { cookies } from 'next/headers';
import { query } from './db';
import crypto from 'crypto';
import { UserRole, AuthUser } from './rbac';

export * from './rbac';

const COOKIE_NAME = 'admin_session';
const SESSION_HOURS = 24;

/**
 * Hash password with native scrypt + random 16-byte salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verify password against stored hash & salt using timingSafeEqual
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const hashBuf = Buffer.from(hash, 'hex');
    if (derivedKey.length !== hashBuf.length) return false;
    return crypto.timingSafeEqual(derivedKey, hashBuf);
  } catch {
    return false;
  }
}

/**
 * Create or refresh an active session bound to a user
 */
export async function createSession(userId?: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO admin_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at`,
    [token, userId || null, expiresAt]
  );
  return token;
}

/**
 * Validate token is not expired
 */
export async function validateSession(token: string): Promise<boolean> {
  const rows = await query<{ token: string }>(
    `SELECT token FROM admin_sessions WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  return rows.length > 0;
}

/**
 * Delete a session on sign out
 */
export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM admin_sessions WHERE token = $1`, [token]);
}

/**
 * Read session token from cookie
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Fast authentication check
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  if (!token) return false;
  return validateSession(token);
}

/**
 * Get current authenticated user with role details
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    // 1. Check if session has a bound user
    const rows = await query<AuthUser>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar_url, u.permissions
       FROM admin_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW() AND u.status = 'active'`,
      [token]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // 2. Backward compatibility fallback:
    // If the session token is valid but has no user_id bound yet, resolve to primary Owner
    const validSession = await query<{ token: string }>(
      `SELECT token FROM admin_sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (validSession.length > 0) {
      const owners = await query<AuthUser>(
        `SELECT id, name, email, phone, role, status, avatar_url, permissions
         FROM users
         WHERE role = 'owner' AND status = 'active'
         ORDER BY id ASC LIMIT 1`
      );

      if (owners.length > 0) {
        await query(`UPDATE admin_sessions SET user_id = $1 WHERE token = $2`, [
          owners[0].id,
          token,
        ]);
        return owners[0];
      }
    }
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
  }

  return null;
}

export { COOKIE_NAME, SESSION_HOURS };

