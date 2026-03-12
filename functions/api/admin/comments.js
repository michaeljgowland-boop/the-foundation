// functions/api/admin/comments.js
// Admin: list pending comments and approve/reject them
import { getSession, requireAdmin, json } from '../../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  const pending = await env.DB.prepare(`
    SELECT c.id, c.article_slug, c.body, c.created_at, c.flag_count, c.flagged,
           u.display_name, u.email
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.approved = 0
    ORDER BY c.created_at ASC
    LIMIT 50
  `).all();

  const flagged = await env.DB.prepare(`
    SELECT c.id, c.article_slug, c.body, c.created_at, c.flag_count,
           u.display_name, u.email
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.approved = 1 AND c.flagged = 1
    ORDER BY c.flag_count DESC
    LIMIT 50
  `).all();

  return json({ pending: pending.results, flagged: flagged.results });
}

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  const { comment_id, action } = await request.json();
  if (!comment_id || !['approve', 'reject'].includes(action)) {
    return json({ error: 'comment_id and action (approve|reject) required' }, 400);
  }

  if (action === 'approve') {
    await env.DB.prepare(
      'UPDATE comments SET approved = 1, flagged = 0 WHERE id = ?'
    ).bind(comment_id).run();
    // Increment article comment count
    await env.DB.prepare(`
      UPDATE articles SET comment_count = comment_count + 1
      WHERE slug = (SELECT article_slug FROM comments WHERE id = ?)
    `).bind(comment_id).run();
  } else {
    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(comment_id).run();
  }

  return json({ success: true });
}
