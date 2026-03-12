// functions/api/auth/register.js
import { hashPassword, generateSessionId, sessionCookie, json } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password, display_name } = await request.json();

    if (!email || !password || !display_name) {
      return json({ error: 'Email, password and display name are required' }, 400);
    }
    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, 400);
    }
    if (display_name.length < 2 || display_name.length > 40) {
      return json({ error: 'Display name must be 2–40 characters' }, 400);
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
      return json({ error: 'An account with this email already exists' }, 409);
    }

    const password_hash = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)'
    ).bind(email.toLowerCase(), password_hash, display_name).run();

    const userId = result.meta.last_row_id;
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, userId, expiresAt).run();

    return json(
      { success: true, display_name },
      201,
      { 'Set-Cookie': sessionCookie(sessionId, expiresAt) }
    );
  } catch (err) {
    console.error('Register error:', err);
    return json({ error: 'Registration failed' }, 500);
  }
}
