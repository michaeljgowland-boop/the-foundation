// functions/api/join.js
import { json } from './_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, source } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'A valid email address is required' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM members WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existing) {
      return json({ success: true, message: 'You are already on our list.' });
    }

    await env.DB.prepare(
      'INSERT INTO members (email, source) VALUES (?, ?)'
    ).bind(email.toLowerCase(), source || 'homepage').run();

    return json({ success: true, message: 'You have joined The Foundation.' }, 201);
  } catch (err) {
    console.error('Join error:', err);
    return json({ error: 'Submission failed' }, 500);
  }
}
