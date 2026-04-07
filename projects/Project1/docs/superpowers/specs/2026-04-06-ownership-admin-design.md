# Post Ownership + Admin Design

**Date:** 2026-04-06
**Status:** Approved

## Overview

Enforce post ownership so users can only edit/delete their own posts. The first registered user becomes a permanent admin who can edit/delete any post.

## Database

Add `is_admin` column to the `users` table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
```

Run this migration at server startup (added to `migrate()` in `db.js`).

**First-user admin logic:** During registration (`POST /api/auth/register`), count existing users before inserting. If count is 0, set `is_admin = true` for the new user. All subsequent registrations get `is_admin = false` (the default).

## Backend

### `GET /api/auth/me`
Add `isAdmin` to the response:
```json
{ "id": 1, "email": "user@example.com", "isAdmin": true }
```

### `PUT /api/posts/:id` and `DELETE /api/posts/:id`
After `requireAuth`, add an ownership/admin check:
1. Fetch the post by ID (404 if not found)
2. Check: `post.user_id === req.session.userId` OR user `is_admin === true`
3. If neither → return `403 { error: 'Forbidden' }`
4. If authorized → proceed with update/delete

Requires fetching the current user's `is_admin` from the DB (one extra query per protected request).

### `POST /api/posts` — no change
### `GET /api/posts`, `GET /api/posts/:id` — no change

## Frontend

**Shared helper:** A module-level `currentUser` variable (populated once by `checkAuth()`) holds `{ id, email, isAdmin }`. Reuse this across pages — no extra fetch.

**Home page preview panel** (`app.js`, home block):
- Pass `currentUser` to `loadPostPreview()`
- Show Edit/Delete buttons only if `post.userId === currentUser.id` OR `currentUser.isAdmin`
- If neither, hide both buttons

**Post page** (`post.html` / single-post block in `app.js`):
- Same condition: show Edit/Delete only for owner or admin

## Out of Scope

- Multiple admins
- Admin promotion UI
- Post ownership transfer
