// functions/api/auth/login.js
import { verifyPassword, generateSessionId, sessionCookie, json } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return json({ error: 'Invalid email or password' }, 401);
    }
    if (user.is_banned) {
      return json({ error: 'This account has been suspended' }, 403);
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    return json(
      { success: true, display_name: user.display_name, is_admin: user.is_admin },
      200,
      { 'Set-Cookie': sessionCookie(sessionId, expiresAt) }
    );
  } catch (err) {
    console.error('Login error:', err);
    return json({ error: 'Login failed' }, 500);
  }
}
