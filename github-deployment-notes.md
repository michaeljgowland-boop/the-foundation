# GitHub Deployment Notes for Claude

This document exists because the egress proxy blocks `api.github.com` (the GitHub REST API), which means API-based file uploads fail. However, **git over HTTPS works fine**. Always use the git clone/push method, not the GitHub API.

## The PAT

Stored in project memory. Fine-grained, Contents read/write on the-foundation repo only.

Repo: `michaeljgowland-boop/the-foundation`

## Deploying an Article — Step by Step

### 1. Push the file to GitHub

```bash
cd /home/claude

# Clone the repo (PAT embedded in URL)
git clone https://YOUR_PAT@github.com/michaeljgowland-boop/the-foundation.git

cd the-foundation

# Copy the article fragment into place
cp /mnt/user-data/outputs/your-slug.html public/posts/your-slug.html

# Configure git identity
git config user.email "michael.j.gowland@gmail.com"
git config user.name "Michael Gowland"

# Commit and push
git add public/posts/your-slug.html
git commit -m "Add [Article Title] article"
git push
```

Cloudflare Pages auto-deploys on push. Article is live within ~60 seconds at:
`thefoundation.ourinter.net/article?slug=your-slug`

### 2. Insert the database record

Use the Cloudflare MCP tool:

```
Cloudflare Developer Platform:d1_database_query
database_id: c0b05a24-b8a8-4fd8-8cc7-fe70638cdeae
```

```sql
INSERT INTO articles (slug, title, subtitle, author, category, tags, excerpt, content_file, is_published, published_at, is_ai_collaborative)
VALUES (
  'your-slug',
  'Article Title',
  'Subtitle here',
  'Author Name',
  'convergence',         -- analysis | politics | society | convergence
  '["tag1","tag2"]',
  'One or two sentence excerpt.',
  'posts/your-slug.html',
  1,
  datetime('now'),
  1                      -- 1 if Human × AI collaborative, 0 if not
);
```

## Key Things Not to Do

- **Do not use `curl` or `urllib` to call `api.github.com`** — the proxy blocks it with 403.
- **Do not try to install the GitHub CLI** — it won't resolve either.
- **Do not forget to set git config identity** before committing or the push may be rejected.

## If the Repo Already Has the File

If redeploying or updating an existing article, git will handle it normally — just copy the new version over and commit as usual. No SHA juggling needed (that's only required for the REST API approach).
