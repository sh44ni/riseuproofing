import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  deleteSession,
  getSessionToken,
  getCurrentUser,
  verifyPassword,
  COOKIE_NAME,
  SESSION_HOURS,
} from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit('admin-login', ip, {
    limit: 5,
    windowMs: 5 * 60 * 1000, // 5 attempts per 5 minutes
  });

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetMs / 1000);
    return NextResponse.json(
      { ok: false, error: `Too many login attempts. Please wait ${retrySec} seconds before retrying.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retrySec),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!password) {
      return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 });
    }

    let authenticatedUser: {
      id: number;
      name: string;
      email: string;
      role: string;
      phone?: string;
      avatar_url?: string | null;
      permissions?: string[];
    } | null = null;

    if (email && typeof email === 'string') {
      // Direct Email + Password authentication
      const rows = await query<{
        id: number;
        name: string;
        email: string;
        phone: string;
        role: string;
        status: string;
        avatar_url: string;
        password_hash: string;
        salt: string;
        permissions: string[];
      }>(
        `SELECT id, name, email, phone, role, status, avatar_url, password_hash, salt, permissions
         FROM users
         WHERE LOWER(email) = LOWER($1)`,
        [email.trim()]
      );

      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
      }

      const user = rows[0];
      if (user.status !== 'active') {
        return NextResponse.json({ ok: false, error: 'This user account has been deactivated' }, { status: 403 });
      }

      const isMatch = verifyPassword(password, user.password_hash, user.salt);
      if (!isMatch) {
        return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
      }

      authenticatedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
        permissions: user.permissions || [],
      };
    } else {
      // Legacy Single-Password fallback (Auto-resolves to Owner)
      const expectedEnvPass = process.env.ADMIN_PASSWORD;
      let matched = false;

      // Check against env password
      if (expectedEnvPass && password === expectedEnvPass) {
        matched = true;
      }

      // If not env pass, check if it matches the owner record in DB
      const owners = await query<{
        id: number;
        name: string;
        email: string;
        phone: string;
        role: string;
        status: string;
        avatar_url: string;
        password_hash: string;
        salt: string;
        permissions: string[];
      }>(`SELECT id, name, email, phone, role, status, avatar_url, password_hash, salt, permissions FROM users WHERE role = 'owner' AND status = 'active' ORDER BY id ASC LIMIT 1`);

      if (owners.length > 0) {
        if (!matched && verifyPassword(password, owners[0].password_hash, owners[0].salt)) {
          matched = true;
        }

        if (matched) {
          authenticatedUser = {
            id: owners[0].id,
            name: owners[0].name,
            email: owners[0].email,
            role: owners[0].role,
            phone: owners[0].phone,
            avatar_url: owners[0].avatar_url,
            permissions: owners[0].permissions || ['*'],
          };
        }
      }

      if (!matched || !authenticatedUser) {
        return NextResponse.json({ ok: false, error: 'Incorrect password. Try again.' }, { status: 401 });
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ ok: false, error: 'Authentication failed' }, { status: 401 });
    }

    // Update last login timestamp
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [authenticatedUser.id]);

    // Create session token bound to this user
    const token = await createSession(authenticatedUser.id);

    const res = NextResponse.json({
      ok: true,
      user: authenticatedUser,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_HOURS * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ ok: false, error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const token = await getSessionToken();
  if (token) await deleteSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
