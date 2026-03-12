// functions/api/articles/index.js
import { json } from '../../_shared/auth.js';

// GET /api/articles?category=&page=1
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  let query = `
    SELECT id, slug, title, subtitle, author, category, tags, excerpt,
           published_at, is_ai_collaborative, comment_count
    FROM articles
    WHERE is_published = 1
  `;
  const bindings = [];

  if (category) {
    query += ' AND category = ?';
    bindings.push(category);
  }

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const articles = await env.DB.prepare(query).bind(...bindings).all();

  const countQuery = category
    ? 'SELECT COUNT(*) as total FROM articles WHERE is_published = 1 AND category = ?'
    : 'SELECT COUNT(*) as total FROM articles WHERE is_published = 1';
  const countResult = await env.DB.prepare(countQuery).bind(...(category ? [category] : [])).first();

  return json({
    articles: articles.results.map(a => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : []
    })),
    total: countResult.total,
    page,
    pages: Math.ceil(countResult.total / limit)
  });
}
