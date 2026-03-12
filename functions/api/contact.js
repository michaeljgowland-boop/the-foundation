// functions/api/contact.js
import { json } from '../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return json({ error: 'All fields are required' }, 400);
    }
    if (message.length < 20) {
      return json({ error: 'Message must be at least 20 characters' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    await env.DB.prepare(
      'INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)'
    ).bind(name.trim(), email.toLowerCase().trim(), message.trim()).run();

    return json({ success: true, message: 'Thank you. We will be in touch.' });
  } catch (err) {
    console.error('Contact error:', err);
    return json({ error: 'Submission failed' }, 500);
  }
}
