// functions/api/articles/[slug].js
import { json } from '../../_shared/auth.js';

export async function onRequestGet({ params, env }) {
  const { slug } = params;
  const article = await env.DB.prepare(
    'SELECT * FROM articles WHERE slug = ? AND is_published = 1'
  ).bind(slug).first();

  if (!article) return json({ error: 'Not found' }, 404);

  return json({
    ...article,
    tags: article.tags ? JSON.parse(article.tags) : []
  });
}
