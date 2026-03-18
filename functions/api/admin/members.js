// functions/api/admin/members.js
// Admin: view mailing list members
import { getSession, requireAdmin, json } from '../../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = 100;
  const offset = (page - 1) * limit;

  const { results: members } = await env.DB.prepare(`
    SELECT id, email, joined_at, source
    FROM members
    ORDER BY joined_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const { results: [{ total }] } = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM members'
  ).all();

  // Stats: signups by source
  const { results: by_source } = await env.DB.prepare(`
    SELECT source, COUNT(*) as count FROM members GROUP BY source ORDER BY count DESC
  `).all();

  // Signups over time (last 30 days, grouped by day)
  const { results: by_day } = await env.DB.prepare(`
    SELECT DATE(joined_at) as day, COUNT(*) as count
    FROM members
    WHERE joined_at >= DATE('now', '-30 days')
    GROUP BY day
    ORDER BY day ASC
  `).all();

  return json({ members, total, page, pages: Math.ceil(total / limit), by_source, by_day });
}
