// functions/api/comments/flag.js
import { getSession, requireAuth, json } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  const authError = requireAuth(session);
  if (authError) return authError;

  const { comment_id } = await request.json();
  if (!comment_id) return json({ error: 'comment_id required' }, 400);

  await env.DB.prepare(`
    UPDATE comments SET flag_count = flag_count + 1, flagged = 1
    WHERE id = ?
  `).bind(comment_id).run();

  return json({ success: true });
}
