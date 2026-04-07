# Deployment Design: Railway + PostgreSQL + Auth

**Date:** 2026-04-06
**Status:** Approved

## Overview

Deploy the blog to Railway with a PostgreSQL database, replacing the JSON file data store. Add user registration and login so write operations are protected. Open registration — anyone can create an account and post.

## Database

Two tables in PostgreSQL replace `data/posts.json`.

### `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `posts`
```sql
CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  language   TEXT NOT NULL DEFAULT 'English',
  emotion    TEXT NOT NULL DEFAULT 'thoughtful',
  theme      TEXT NOT NULL DEFAULT 'classic-paper',
  excerpt    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  user_id    INTEGER REFERENCES users(id)
);
```

`user_id` is nullable so existing posts (migrated from JSON) don't need an owner. Future multi-user ownership is supported without a schema change.

## Authentication

**New dependencies:**
- `bcrypt` — password hashing
- `express-session` — session middleware
- `connect-pg-simple` — store sessions in PostgreSQL (survives restarts/redeploys)

**New API routes:**
```
POST /api/auth/register   { email, password } → creates user, starts session
POST /api/auth/login      { email, password } → validates credentials, starts session
POST /api/auth/logout     → destroys session
GET  /api/auth/me         → returns { id, email } or 401
```

**Route protection:**

| Route | Auth required |
|-------|--------------|
| GET /api/posts | No |
| GET /api/posts/:id | No |
| POST /api/posts | Yes |
| PUT /api/posts/:id | Yes |
| DELETE /api/posts/:id | Yes |

**Frontend changes:**
- Add `public/login.html` — login form, same visual style as app
- Add `public/register.html` — registration form
- `editor.html` — check `GET /api/auth/me` on load; redirect to `/login.html` if 401
- `index.html` — show Login/Logout button in header based on auth state
- `app.js` — add auth state handling for `home` and `editor` pages

## Data Migration

On first boot, the server:
1. Creates `users` and `posts` tables if they don't exist (idempotent)
2. Reads `data/posts.json` if it exists and inserts any posts not already in the DB
3. After migration the JSON file is no longer used (but not deleted, as a backup)

Migration runs inside `server.js` at startup before the server begins listening.

## Railway Deployment

**Steps:**
1. Push repo to GitHub
2. Create Railway project → connect GitHub repo (auto-deploys on push to `main`)
3. Add PostgreSQL plugin — Railway sets `DATABASE_URL` automatically
4. Add env var: `SESSION_SECRET` (a long random string)
5. Railway detects Node.js, runs `npm start`, exposes a `*.railway.app` URL

**No Docker or CI config required.**

## Environment Variables

| Variable | Set by | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Railway (auto) | PostgreSQL connection string |
| `SESSION_SECRET` | Manual | Signs session cookies |
| `PORT` | Railway (auto) | Already used in server.js |

## Out of Scope (this phase)

- Per-user post ownership enforcement (edit/delete only your own posts)
- Admin roles
- Email verification
- Password reset flow
- Custom domain (can be added in Railway settings later)
