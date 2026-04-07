# Post Ownership + Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can only edit/delete their own posts; the first registered user is a permanent admin who can edit/delete any post.

**Architecture:** Add `is_admin` column to `users` table. Registration checks if any users exist — if not, marks the new user as admin. PUT/DELETE endpoints fetch the post and the user's `is_admin` flag, returning 403 if neither owner nor admin. Frontend hides Edit/Delete buttons for posts the current user does not own (unless admin), using a module-level `currentUser` variable populated once per page load.

**Tech Stack:** Node.js, Express, PostgreSQL (`pg`), vanilla JS frontend.

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `db.js` | Add `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin` to `migrate()` |
| Modify | `routes/auth.js` | Register: first-user admin logic; Me + Login: include `isAdmin` in response |
| Modify | `server.js` | PUT + DELETE: ownership/admin check before proceeding |
| Modify | `public/app.js` | Module-level `currentUser`; home preview + single-post: hide Edit/Delete conditionally |

---

## Task 1: Add `is_admin` column migration

**Files:**
- Modify: `db.js`

- [ ] **Step 1: Add the ALTER TABLE statement to `migrate()`**

In `db.js`, inside the `migrate()` function, after the `CREATE TABLE IF NOT EXISTS posts` query block and before the JSON migration block, add:

```javascript
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
  `);
```

The full `migrate()` function should now look like this (showing the addition in context):

```javascript
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
  `);

  // ... JSON migration block follows unchanged ...
}
```

- [ ] **Step 2: Verify the statement is idempotent**

`ADD COLUMN IF NOT EXISTS` means running `migrate()` multiple times (restarts, redeploys) will not error if the column already exists. Confirm the syntax is exactly as above before committing.

- [ ] **Step 3: Commit**

```bash
git add db.js
git commit -m "feat: add is_admin column migration to users table"
```

---

## Task 2: Update auth routes — first-user admin + isAdmin in responses

**Files:**
- Modify: `routes/auth.js`

### Step group A: Register — make first user an admin

- [ ] **Step 1: Replace the register route**

The current register route (lines 8–30) inserts a user without checking if it's the first. Replace the entire route with:

```javascript
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM users');
    const isAdmin = parseInt(countRows[0].count, 10) === 0;
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin',
      [email.toLowerCase().trim(), passwordHash, isAdmin]
    );
    req.session.userId = rows[0].id;
    res.status(201).json({ id: rows[0].id, email: rows[0].email, isAdmin: rows[0].is_admin });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Step group B: Me — add isAdmin to response

- [ ] **Step 2: Update the me route (lines 66–82)**

Change the SELECT query and response:

```javascript
// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, email, is_admin FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ id: rows[0].id, email: rows[0].email, isAdmin: rows[0].is_admin });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Step group C: Login — add isAdmin to response

- [ ] **Step 3: Update the login route (lines 33–55)**

Change the SELECT query (add `is_admin`) and the final `res.json()`:

```javascript
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = rows[0].id;
    res.json({ id: rows[0].id, email: rows[0].email, isAdmin: rows[0].is_admin });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 4: Verify manually**

```bash
# Start server locally (if you have a local DB):
SESSION_SECRET=devsecret npm start

# Register first user — response should have isAdmin: true
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"first@test.com","password":"password123"}' | jq .
# Expected: { "id": 1, "email": "first@test.com", "isAdmin": true }

# Register second user — response should have isAdmin: false
curl -s -c cookies2.txt -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"second@test.com","password":"password123"}' | jq .
# Expected: { "id": 2, "email": "second@test.com", "isAdmin": false }

# Check /me for first user
curl -s -b cookies.txt http://localhost:3000/api/auth/me | jq .
# Expected: { "id": 1, "email": "first@test.com", "isAdmin": true }
```

If no local DB, skip to Task 4 and verify end-to-end after deploy.

- [ ] **Step 5: Commit**

```bash
git add routes/auth.js
git commit -m "feat: first registered user becomes admin, add isAdmin to auth responses"
```

---

## Task 3: Add ownership check to PUT and DELETE endpoints

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Replace the PUT route (lines 101–119)**

```javascript
// PUT update post (auth required)
app.put('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { title, body, language, emotion, theme, excerpt } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

    const { rows: postRows } = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1', [req.params.id]
    );
    if (postRows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const { rows: userRows } = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1', [req.session.userId]
    );
    const isAdmin = userRows.length > 0 && userRows[0].is_admin;
    if (postRows[0].user_id !== req.session.userId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `UPDATE posts SET title=$1, body=$2, language=$3, emotion=$4, theme=$5, excerpt=$6, updated_at=$7
       WHERE id=$8 RETURNING *`,
      [title.trim(), body.trim(), language || 'English', emotion || 'thoughtful',
       theme || 'classic-paper', excerpt || '', now, req.params.id]
    );
    res.json(rowToPost(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 2: Replace the DELETE route (lines 121–131)**

```javascript
// DELETE post (auth required)
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { rows: postRows } = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1', [req.params.id]
    );
    if (postRows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const { rows: userRows } = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1', [req.session.userId]
    );
    const isAdmin = userRows.length > 0 && userRows[0].is_admin;
    if (postRows[0].user_id !== req.session.userId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 3: Verify unauthenticated and forbidden responses**

```bash
# Try to edit a post that doesn't belong to you (using second user's cookies):
curl -s -b cookies2.txt -X PUT http://localhost:3000/api/posts/SOME_POST_ID \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked","body":"Not mine"}' | jq .
# Expected: { "error": "Forbidden" } with HTTP 403

# Admin can edit any post (using first user's cookies):
curl -s -b cookies.txt -X PUT http://localhost:3000/api/posts/SOME_POST_ID \
  -H 'Content-Type: application/json' \
  -d '{"title":"Admin edited","body":"Admin can do this"}' | jq .
# Expected: updated post JSON with HTTP 200
```

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: enforce post ownership on PUT and DELETE, admin can bypass"
```

---

## Task 4: Frontend — hide Edit/Delete based on ownership and admin

**Files:**
- Modify: `public/app.js`

### Overview of changes

- Add `let currentUser = null;` at module level (after the `checkAuth` function definition)
- Home page: set `currentUser` inside the auth IIFE, then call `loadPostsIntoSidebar()` from there (move it out of the standalone bottom call)
- `loadPostPreview()`: show Edit/Delete only if `currentUser && (post.userId === currentUser.id || currentUser.isAdmin)`
- Single-post block: set `currentUser` inside its auth IIFE; show Edit/Delete only for owner or admin

- [ ] **Step 1: Add `let currentUser = null;` after `checkAuth` definition**

Find the `checkAuth` function (currently after the dark mode IIFE). After its closing `}`, add one line:

```javascript
let currentUser = null;
```

- [ ] **Step 2: Update the home page auth IIFE to set `currentUser` and call `loadPostsIntoSidebar()`**

Find the auth IIFE at the top of the `if (document.body.id === 'home')` block. Replace it with:

```javascript
  // Show/hide nav based on auth state, then load posts
  (async () => {
    currentUser = await checkAuth();
    const newPostBtn = document.getElementById('new-post-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    if (currentUser) {
      if (newPostBtn) newPostBtn.style.display = '';
      if (logoutBtn) {
        logoutBtn.style.display = '';
        logoutBtn.addEventListener('click', async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.reload();
        });
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
    }
    loadPostsIntoSidebar();
  })();
```

- [ ] **Step 3: Remove the standalone `loadPostsIntoSidebar()` call at the bottom of the home block**

Find the line near the bottom of the home block (just before the closing `}`) that reads:

```javascript
  loadPostsIntoSidebar();
```

Delete it. It is now called from inside the auth IIFE above.

- [ ] **Step 4: Update `loadPostPreview()` to hide Edit/Delete for non-owners**

Inside `loadPostPreview()`, find where `editBtn` and `deleteBtn` event listeners are attached. Just before those `addEventListener` calls, add a visibility check:

Find this section (around the `editBtn` / `deleteBtn` area):
```javascript
    editBtn.addEventListener('click', () => {
      window.location.href = `editor.html?id=${postId}`;
    });

    deleteBtn.addEventListener('click', async () => {
```

Replace with:
```javascript
    // Show edit/delete only for post owner or admin
    const canEdit = currentUser && (post.userId === currentUser.id || currentUser.isAdmin);
    if (!canEdit) {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    editBtn.addEventListener('click', () => {
      window.location.href = `editor.html?id=${postId}`;
    });

    deleteBtn.addEventListener('click', async () => {
```

- [ ] **Step 5: Update the single-post block auth IIFE to set `currentUser` and control buttons**

Find the auth IIFE at the top of the `if (document.body.id === 'single-post')` block. Replace it with:

```javascript
  // Show edit/delete controls only for post owner or admin
  (async () => {
    currentUser = await checkAuth();
    if (currentUser) {
      const newPostBtn = document.getElementById('new-post-btn');
      if (newPostBtn) newPostBtn.style.display = '';
      // Edit/Delete visibility is set after loadPost() runs — see loadPost() below
    }
  })();
```

Then, inside the `loadPost()` function within the single-post block, find where `post` data is rendered (after the `document.getElementById('post-title').textContent = post.title` etc. lines), and add at the end of the try block:

```javascript
      // Show edit/delete only for owner or admin
      const canEdit = currentUser && (post.userId === currentUser.id || currentUser.isAdmin);
      document.getElementById('btn-edit').style.display = canEdit ? '' : 'none';
      document.getElementById('btn-delete').style.display = canEdit ? '' : 'none';
```

- [ ] **Step 6: Verify in browser**

1. Open the blog while logged out → no Edit/Delete buttons visible anywhere
2. Log in as the admin (first registered user) → Edit/Delete visible on all posts
3. Log in as a second user → Edit/Delete visible only on posts that user wrote, hidden on others
4. As second user, try navigating directly to `editor.html?id=ADMIN_POST_ID` → should load (the API will 403 on save, which is correct)

- [ ] **Step 7: Commit**

```bash
git add public/app.js
git commit -m "feat: hide edit/delete buttons based on post ownership and admin status"
```

---

## Task 5: Deploy

- [ ] **Step 1: Push to GitLab**

```bash
git push origin main
```

Render will auto-deploy. Watch the deploy logs in the Render dashboard.

- [ ] **Step 2: Verify on live URL**

1. Open your `*.onrender.com` URL
2. The first account you register (or already registered) is the admin
3. Log in as admin → Edit/Delete visible on all posts
4. Register a second account → Edit/Delete only visible on posts written by that account
5. As second user, try editing an admin post via curl:

```bash
curl -s -X PUT https://YOUR_APP.onrender.com/api/posts/SOME_POST_ID \
  -H 'Content-Type: application/json' \
  -H 'Cookie: connect.sid=SECOND_USER_SESSION' \
  -d '{"title":"Hack attempt","body":"should fail"}' | jq .
# Expected: { "error": "Forbidden" }
```
