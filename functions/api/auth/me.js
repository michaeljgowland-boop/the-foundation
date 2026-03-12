// functions/api/auth/me.js
import { getSession, json } from '../../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session) {
    return json({ authenticated: false }, 200);
  }
  return json({
    authenticated: true,
    display_name: session.display_name,
    email: session.email,
    is_admin: session.is_admin
  });
}
