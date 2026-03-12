// functions/_shared/auth.js
// Shared auth utilities for Pages Functions

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

export function generateSessionId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const sessionId = match[1];
  const session = await env.DB.prepare(
    'SELECT s.*, u.id as user_id, u.display_name, u.email, u.is_admin, u.is_banned FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")'
  ).bind(sessionId).first();

  return session || null;
}

export function sessionCookie(sessionId, expires) {
  return `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=${new Date(expires).toUTCString()}`;
}

export function clearSessionCookie() {
  return `session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export function requireAuth(session) {
  if (!session) {
    return json({ error: 'Authentication required' }, 401);
  }
  if (session.is_banned) {
    return json({ error: 'Account suspended' }, 403);
  }
  return null;
}

export function requireAdmin(session) {
  const authError = requireAuth(session);
  if (authError) return authError;
  if (!session.is_admin) {
    return json({ error: 'Admin access required' }, 403);
  }
  return null;
}
