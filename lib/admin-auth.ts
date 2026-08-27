import { cookies } from 'next/headers';
import { query } from './db';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_HOURS = 24;

export async function createSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO admin_sessions (token, expires_at) VALUES ($1, $2)
     ON CONFLICT (token) DO NOTHING`,
    [token, expiresAt]
  );
  return token;
}

export async function validateSession(token: string): Promise<boolean> {
  const rows = await query<{ token: string }>(
    `SELECT token FROM admin_sessions WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  return rows.length > 0;
}

export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM admin_sessions WHERE token = $1`, [token]);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  if (!token) return false;
  return validateSession(token);
}

export { COOKIE_NAME, SESSION_HOURS };
