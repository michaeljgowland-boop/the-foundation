// functions/api/comments/[slug].js
import { getSession, requireAuth, json } from '../../_shared/auth.js';

// GET /api/comments/:slug — fetch approved comments for an article
export async function onRequestGet({ params, env }) {
  const { slug } = params;
  const comments = await env.DB.prepare(`
    SELECT c.id, c.body, c.created_at, c.parent_id,
           u.display_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.article_slug = ? AND c.approved = 1
    ORDER BY c.created_at ASC
  `).bind(slug).all();

  return json({ comments: comments.results });
}

// POST /api/comments/:slug — submit a comment (requires login)
export async function onRequestPost({ request, params, env }) {
  const session = await getSession(request, env);
  const authError = requireAuth(session);
  if (authError) return authError;

  const { slug } = params;
  const { body, parent_id } = await request.json();

  if (!body || body.trim().length < 10) {
    return json({ error: 'Comment must be at least 10 characters' }, 400);
  }
  if (body.length > 2000) {
    return json({ error: 'Comment must be under 2000 characters' }, 400);
  }

  // Check article exists and is published
  const article = await env.DB.prepare(
    'SELECT slug FROM articles WHERE slug = ? AND is_published = 1'
  ).bind(slug).first();
  if (!article) {
    return json({ error: 'Article not found' }, 404);
  }

  // Rate limit: max 3 comments per hour per user
  const recentCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE user_id = ? AND created_at > datetime('now', '-1 hour')
  `).bind(session.user_id).first();
  if (recentCount.count >= 3) {
    return json({ error: 'Please wait before posting more comments' }, 429);
  }

  await env.DB.prepare(`
    INSERT INTO comments (article_slug, user_id, body, parent_id, approved)
    VALUES (?, ?, ?, ?, 0)
  `).bind(slug, session.user_id, body.trim(), parent_id || null).run();

  return json({
    success: true,
    message: 'Your comment has been submitted for moderation'
  }, 201);
}
