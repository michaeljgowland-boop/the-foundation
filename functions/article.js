// functions/article.js
// Intercepts requests to /article and /article.html
// Fetches article metadata from D1 and injects Open Graph meta tags
// so social media scrapers (which don't run JS) get correct previews.

const SITE_URL = 'https://thefoundation.ourinter.net';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export async function onRequestGet({ request, env, next }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // If no slug, serve the shell as-is with default tags
  if (!slug || !env.DB) {
    return injectOG(await next(), {
      title: 'Analysis — The Foundation',
      description: 'Rigorous analysis of institutional capture and civilisational risk.',
      url: `${SITE_URL}/article.html`,
      image: DEFAULT_OG_IMAGE,
    });
  }

  // Try to fetch article metadata from D1
  let article = null;
  try {
    article = await env.DB.prepare(
      'SELECT title, subtitle, excerpt, author, category FROM articles WHERE slug = ? AND is_published = 1'
    ).bind(slug).first();
  } catch (_) {
    // DB unavailable — fall through to shell
  }

  if (!article) {
    return injectOG(await next(), {
      title: 'Analysis — The Foundation',
      description: 'Rigorous analysis of institutional capture and civilisational risk.',
      url: `${SITE_URL}/article.html?slug=${slug}`,
      image: DEFAULT_OG_IMAGE,
    });
  }

  const title = article.subtitle
    ? `${article.title} — ${article.subtitle}`
    : article.title;
  const description = article.excerpt ||
    `${article.title} — analysis from The Foundation.`;

  return injectOG(await next(), {
    title: `${article.title} — The Foundation`,
    description,
    url: `${SITE_URL}/article.html?slug=${slug}`,
    image: DEFAULT_OG_IMAGE,
    author: article.author,
    articleTitle: article.title,
  });
}

async function injectOG(response, meta) {
  const html = await response.text();

  const ogTags = `
  <!-- Open Graph (injected server-side for social sharing) -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="The Foundation">
  <meta property="og:url" content="${esc(meta.url)}">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:image" content="${esc(meta.image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  ${meta.author ? `<meta property="article:author" content="${esc(meta.author)}">` : ''}
  <!-- Twitter/X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(meta.title)}">
  <meta name="twitter:description" content="${esc(meta.description)}">
  <meta name="twitter:image" content="${esc(meta.image)}">`;

  // Also update the <title> tag with the article title
  const titleTag = meta.articleTitle
    ? `<title>${esc(meta.articleTitle)} — The Foundation</title>`
    : `<title>${esc(meta.title)}</title>`;

  const patched = html
    .replace(/<title>.*?<\/title>/, titleTag)
    .replace('</head>', `${ogTags}\n</head>`);

  return new Response(patched, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
