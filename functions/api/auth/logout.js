// functions/api/auth/logout.js
import { getSession, clearSessionCookie, json } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  if (session) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
  }
  return json({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
