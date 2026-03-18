// functions/api/admin/users.js
// Admin: manage registered users
import { getSession, requireAdmin, json } from '../../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { results: users } = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name, u.created_at, u.is_banned, u.is_admin,
           COUNT(DISTINCT s.id) as active_sessions,
           COUNT(DISTINCT c.id) as comment_count
    FROM users u
    LEFT JOIN sessions s ON s.user_id = u.id AND s.expires_at > datetime('now')
    LEFT JOIN comments c ON c.user_id = u.id AND c.approved = 1
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const { results: [{ total }] } = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM users'
  ).all();

  return json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  const { user_id, action } = await request.json();
  if (!user_id || !['ban', 'unban', 'make_admin', 'remove_admin'].includes(action)) {
    return json({ error: 'user_id and valid action required' }, 400);
  }

  // Prevent admin from acting on themselves
  if (user_id === session.user_id) {
    return json({ error: 'Cannot modify your own account' }, 400);
  }

  const updates = {
    ban:          'UPDATE users SET is_banned = 1 WHERE id = ?',
    unban:        'UPDATE users SET is_banned = 0 WHERE id = ?',
    make_admin:   'UPDATE users SET is_admin = 1 WHERE id = ?',
    remove_admin: 'UPDATE users SET is_admin = 0 WHERE id = ?',
  };

  await env.DB.prepare(updates[action]).bind(user_id).run();
  return json({ success: true });
}
