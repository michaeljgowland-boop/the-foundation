# The Foundation — thefoundation.ourinter.net

A publication and community platform for The Foundation's analysis of institutional capture, civilisational risk, and the convergence of human and artificial intelligence.

## Stack

- **Cloudflare Pages** — static site hosting with auto-deploy from GitHub
- **Pages Functions** — serverless API endpoints (in `/functions`)
- **Cloudflare D1** — SQLite database (`foundation-db`)
- **No frameworks** — plain HTML/CSS/JS for the frontend

## D1 Database

- **Name:** `foundation-db`
- **ID:** `c0b05a24-b8a8-4fd8-8cc7-fe70638cdeae`
- **Region:** ENAM (US East)
- Schema is in `schema.sql` — already applied to the live database.

## Project Structure

```
foundation/
├── public/                  ← Static site (Cloudflare Pages root)
│   ├── index.html           ← Homepage
│   ├── analysis.html        ← Articles listing
│   ├── convergence.html     ← AI collaboration section
│   ├── article.html         ← Article reader (slug via query param)
│   ├── about.html           ← The Foundation paper / about
│   ├── contact.html         ← Contact form
│   ├── join.html            ← Account registration
│   ├── css/main.css         ← Shared design system
│   ├── js/main.js           ← Auth, scroll reveal, modal
│   └── posts/               ← Article HTML content files
│       └── example-article.html
├── functions/               ← Pages Functions (serverless API)
│   ├── _shared/auth.js      ← Auth utilities shared across functions
│   └── api/
│       ├── join.js          ← POST /api/join (mailing list)
│       ├── contact.js       ← POST /api/contact
│       ├── articles/
│       │   ├── index.js     ← GET /api/articles
│       │   └── [slug].js    ← GET /api/articles/:slug
│       ├── comments/
│       │   ├── [slug].js    ← GET/POST /api/comments/:slug
│       │   └── flag.js      ← POST /api/comments/flag
│       ├── auth/
│       │   ├── register.js  ← POST /api/auth/register
│       │   ├── login.js     ← POST /api/auth/login
│       │   ├── logout.js    ← POST /api/auth/logout
│       │   └── me.js        ← GET /api/auth/me
│       └── admin/
│           └── comments.js  ← GET/POST /api/admin/comments
├── wrangler.toml            ← Cloudflare config + D1 binding
└── schema.sql               ← Database schema reference
```

## Deploy to Cloudflare Pages

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial Foundation site"
git remote add origin https://github.com/YOUR_USERNAME/the-foundation.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
2. Create application → Pages → Connect to Git
3. Select your repository
4. Set **Build output directory** to `public`
5. Leave build command empty (no build step needed)
6. Deploy

### 3. Add D1 binding in Cloudflare Dashboard
1. Go to your Pages project → Settings → Bindings
2. Add D1 database binding:
   - Variable name: `DB`
   - D1 database: `foundation-db`

### 4. Set environment variables
In Pages → Settings → Environment variables, add:
- `JWT_SECRET` — a long random string (generate with `openssl rand -hex 32`)

### 5. Set up custom domain
1. Pages project → Custom domains → Add domain
2. Add `thefoundation.ourinter.net`
3. In your DNS (Cloudflare for ourinter.net), add the CNAME record Cloudflare shows you

## Publishing Articles

Articles are stored in two parts:
1. **Metadata** in D1 (`articles` table)
2. **Content** as HTML files in `public/posts/`

### To publish an article:

1. Write the article body as an HTML fragment (no `<html>` wrapper) and save to `public/posts/your-slug.html`

2. Insert the metadata into D1:
```sql
INSERT INTO articles (slug, title, subtitle, author, category, tags, excerpt, content_file, is_published, published_at)
VALUES (
  'your-slug',
  'Your Article Title',
  'A subtitle if needed',
  'Author Name',
  'analysis',  -- or: politics | society | convergence
  '["democracy","institutions"]',
  'A one or two sentence excerpt for the listing page.',
  'posts/your-slug.html',
  1,
  datetime('now')
);
```

You can run this via: **Cloudflare Dashboard → D1 → foundation-db → Console**

### Categories
- `analysis` — General Foundation analysis
- `politics` — Political analysis
- `society` — Social issues and societal direction
- `convergence` — Human × AI collaborative pieces (set `is_ai_collaborative = 1`)

### Marking a piece as AI-collaborative
Add `is_ai_collaborative = 1` when inserting, and set `category = 'convergence'`. These pieces get the "Human × AI" badge and blue accent styling.

## Admin — Comment Moderation

Comments are held for moderation by default (`approved = 0`).

To approve/reject comments, use the admin API (requires an admin account):
```bash
# List pending comments
curl https://thefoundation.ourinter.net/api/admin/comments \
  -H "Cookie: session=YOUR_SESSION"

# Approve a comment
curl -X POST https://thefoundation.ourinter.net/api/admin/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{"comment_id": 1, "action": "approve"}'
```

### Making yourself an admin
After registering your account, run in D1 console:
```sql
UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';
```

## Relationship to ourinter.net

This site is designed to be the first node of the broader ourinter.net network. The `foundation-db` D1 database uses a user/session schema that can be shared with or federated to a future central auth system for ourinter.net. When that platform launches, consider:

- Shared auth (single sign-on across subdomains)
- Shared user table or cross-domain session tokens
- Foundation members as early adopters of the broader network
