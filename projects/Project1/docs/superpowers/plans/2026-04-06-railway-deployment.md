# Railway Deployment + PostgreSQL + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the blog to Railway with PostgreSQL as the database and session-based auth (register/login/logout) protecting write operations.

**Architecture:** Replace the JSON file data store with PostgreSQL via the `pg` library. Add `express-session` backed by PostgreSQL for persistent sessions. Auth routes live in `routes/auth.js`, protected by a `middleware/auth.js` guard. Frontend gains `login.html` and `register.html` pages; `app.js` checks auth state to show/hide the editor link and handle redirects.

**Tech Stack:** Node.js, Express 4, `pg` (PostgreSQL client), `bcrypt` (password hashing), `express-session` + `connect-pg-simple` (session storage), Railway (hosting + managed PostgreSQL).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `db.js` | PostgreSQL pool + `migrate()` function |
| Create | `middleware/auth.js` | `requireAuth` middleware |
| Create | `routes/auth.js` | register / login / logout / me endpoints |
| Modify | `server.js` | Use pg for posts CRUD; mount session + auth; protect write routes; call migrate() on startup |
| Create | `public/login.html` | Login form page |
| Create | `public/register.html` | Registration form page |
| Modify | `public/index.html` | Add auth nav (Login/Logout button) |
| Modify | `public/app.js` | Add `checkAuth()` + auth state for home and editor pages |
| Modify | `package.json` | Add dependencies + `engines` field for Railway |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install pg bcrypt express-session connect-pg-simple
```

Expected output: packages added to `node_modules/` and `package.json` updated.

- [ ] **Step 2: Verify package.json has all four packages**

Open `package.json` and confirm `dependencies` contains `pg`, `bcrypt`, `express-session`, and `connect-pg-simple`.

- [ ] **Step 3: Add `engines` field and commit**

Edit `package.json` to add the `engines` field so Railway knows which Node version to use:

```json
{
  "name": "local-blog",
  "version": "1.0.0",
  "description": "A simple local blog website",
  "main": "server.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "connect-pg-simple": "^9.0.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "pg": "^8.11.3"
  }
}
```

```bash
git add package.json package-lock.json
git commit -m "feat: add pg, bcrypt, express-session, connect-pg-simple"
```

---

## Task 2: Create `db.js` — PostgreSQL pool and migration

**Files:**
- Create: `db.js`

- [ ] **Step 1: Create `db.js`**

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

  // Migrate existing posts from JSON file (idempotent — skips duplicates)
  const dataFile = path.join(__dirname, 'data', 'posts.json');
  if (fs.existsSync(dataFile)) {
    const posts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    for (const post of posts) {
      await pool.query(
        `INSERT INTO posts (id, title, body, language, emotion, theme, excerpt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          post.id,
          post.title,
          post.body,
          post.language || 'English',
          post.emotion || 'thoughtful',
          post.theme || 'classic-paper',
          post.excerpt || '',
          post.createdAt,
          post.updatedAt
        ]
      );
    }
    console.log(`Migrated ${posts.length} posts from JSON`);
  }

  console.log('Database migration complete');
}

module.exports = { pool, migrate };
```

- [ ] **Step 2: Commit**

```bash
git add db.js
git commit -m "feat: add PostgreSQL pool and migration function"
```

---

## Task 3: Create `middleware/auth.js`

**Files:**
- Create: `middleware/auth.js`

- [ ] **Step 1: Create the middleware directory and file**

```javascript
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = { requireAuth };
```

- [ ] **Step 2: Commit**

```bash
git add middleware/auth.js
git commit -m "feat: add requireAuth middleware"
```

---

## Task 4: Create `routes/auth.js` — register, login, logout, me

**Files:**
- Create: `routes/auth.js`

- [ ] **Step 1: Create `routes/auth.js`**

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

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
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase().trim(), passwordHash]
    );
    req.session.userId = rows[0].id;
    res.status(201).json({ id: rows[0].id, email: rows[0].email });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
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
    res.json({ id: rows[0].id, email: rows[0].email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ id: rows[0].id, email: rows[0].email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add routes/auth.js
git commit -m "feat: add auth routes (register, login, logout, me)"
```

---

## Task 5: Rewrite `server.js` — use PostgreSQL for posts, add sessions and auth

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Replace `server.js` entirely**

```javascript
const express = require('express');
const path = require('path');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { pool, migrate } = require('./db');
const authRouter = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's proxy so secure cookies work over HTTPS
app.set('trust proxy', 1);

// Session middleware — store in PostgreSQL so sessions survive redeploys
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes
app.use('/api/auth', authRouter);

// Map DB row (snake_case) to API response (camelCase)
function rowToPost(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    language: row.language,
    emotion: row.emotion,
    theme: row.theme,
    excerpt: row.excerpt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id
  };
}

// GET all posts (newest first)
app.get('/api/posts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows.map(rowToPost));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(rowToPost(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create post (auth required)
app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { title, body, language, emotion, theme, excerpt } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
    const now = new Date().toISOString();
    const id = String(Date.now());
    const { rows } = await pool.query(
      `INSERT INTO posts (id, title, body, language, emotion, theme, excerpt, created_at, updated_at, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, title.trim(), body.trim(), language || 'English', emotion || 'thoughtful',
       theme || 'classic-paper', excerpt || '', now, now, req.session.userId]
    );
    res.status(201).json(rowToPost(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update post (auth required)
app.put('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { title, body, language, emotion, theme, excerpt } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `UPDATE posts SET title=$1, body=$2, language=$3, emotion=$4, theme=$5, excerpt=$6, updated_at=$7
       WHERE id=$8 RETURNING *`,
      [title.trim(), body.trim(), language || 'English', emotion || 'thoughtful',
       theme || 'classic-paper', excerpt || '', now, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(rowToPost(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE post (auth required)
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run DB migration then start server
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Blog running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Test locally with a local PostgreSQL or set DATABASE_URL**

If you have PostgreSQL running locally:
```bash
DATABASE_URL=postgresql://localhost/blog_dev SESSION_SECRET=devsecret npm start
```

Expected output:
```
Migrated N posts from JSON
Database migration complete
Blog running at http://localhost:3000
```

If no local PostgreSQL, skip to Task 10 and test after Railway setup.

- [ ] **Step 3: Verify the GET endpoints still work**

```bash
curl http://localhost:3000/api/posts
```

Expected: JSON array of posts.

```bash
curl http://localhost:3000/api/auth/me
```

Expected: `{"error":"Not authenticated"}`

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: migrate server.js to PostgreSQL with session auth"
```

---

## Task 6: Create `public/login.html`

**Files:**
- Create: `public/login.html`

- [ ] **Step 1: Create login page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — My Blog</title>
  <link rel="stylesheet" href="style.css">
  <script>if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark-mode')</script>
</head>
<body id="login" class="theme-classic-paper">
  <header>
    <div class="container">
      <h1><a href="/">My Blog</a></h1>
      <div class="header-actions">
        <button id="dark-toggle" class="btn-icon" aria-label="Toggle dark mode"><span class="toggle-icon">☾</span></button>
      </div>
    </div>
  </header>

  <main class="editor-main">
    <div class="editor-container" style="max-width:420px">
      <h2>Login</h2>
      <p id="auth-error" style="color:#dc2626;display:none"></p>
      <form id="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required autocomplete="current-password">
        </div>
        <div class="form-footer">
          <button type="submit" class="btn btn-primary" id="submit-btn">Login</button>
          <a href="/register.html" class="btn btn-secondary">Register</a>
        </div>
      </form>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/login.html
git commit -m "feat: add login page"
```

---

## Task 7: Create `public/register.html`

**Files:**
- Create: `public/register.html`

- [ ] **Step 1: Create register page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register — My Blog</title>
  <link rel="stylesheet" href="style.css">
  <script>if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark-mode')</script>
</head>
<body id="register" class="theme-classic-paper">
  <header>
    <div class="container">
      <h1><a href="/">My Blog</a></h1>
      <div class="header-actions">
        <button id="dark-toggle" class="btn-icon" aria-label="Toggle dark mode"><span class="toggle-icon">☾</span></button>
      </div>
    </div>
  </header>

  <main class="editor-main">
    <div class="editor-container" style="max-width:420px">
      <h2>Create Account</h2>
      <p id="auth-error" style="color:#dc2626;display:none"></p>
      <form id="register-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="password">Password <span style="font-weight:normal;font-size:.85em">(min 8 characters)</span></label>
          <input type="password" id="password" name="password" required autocomplete="new-password" minlength="8">
        </div>
        <div class="form-footer">
          <button type="submit" class="btn btn-primary" id="submit-btn">Create Account</button>
          <a href="/login.html" class="btn btn-secondary">Already have an account?</a>
        </div>
      </form>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/register.html
git commit -m "feat: add register page"
```

---

## Task 8: Update `public/index.html` — add auth nav

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Replace the `header-actions` div (lines 22–26) to add auth nav**

Find this block:
```html
      <div class="header-actions">
        <button id="dark-toggle" class="btn-icon" aria-label="Toggle dark mode"><span class="toggle-icon">☾</span></button>
        <a href="editor.html" class="btn btn-primary">+ New Post</a>
      </div>
```

Replace with:
```html
      <div class="header-actions">
        <button id="dark-toggle" class="btn-icon" aria-label="Toggle dark mode"><span class="toggle-icon">☾</span></button>
        <a href="editor.html" class="btn btn-primary" id="new-post-btn" style="display:none">+ New Post</a>
        <a href="/login.html" class="btn btn-secondary" id="login-btn" style="display:none">Login</a>
        <button class="btn btn-secondary" id="logout-btn" style="display:none">Logout</button>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "feat: add auth nav buttons to home page header"
```

---

## Task 9: Update `public/app.js` — auth state management

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Add `checkAuth` helper function**

After the closing `})();` of the dark mode IIFE (after line 235), add this function:

```javascript
// ── Auth State ─────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) return await res.json(); // { id, email }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Add auth state wiring to the home page block**

At the top of the `if (document.body.id === 'home')` block (after line 238, before `const sidebarList`), add:

```javascript
  // Show/hide nav based on auth state
  (async () => {
    const user = await checkAuth();
    const newPostBtn = document.getElementById('new-post-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    if (user) {
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
  })();
```

- [ ] **Step 3: Add auth guard to the editor page block**

At the very top of the `if (document.body.id === 'editor')` block (after line 424, before `const id = getParam('id')`), add:

```javascript
  // Redirect to login if not authenticated
  (async () => {
    const user = await checkAuth();
    if (!user) window.location.href = '/login.html';
  })();
```

- [ ] **Step 4: Add login form handler**

After the editor block's closing `}` and before the service worker registration, add:

```javascript
// ── Login Page ─────────────────────────────────────────────────
if (document.body.id === 'login') {
  // Redirect to home if already logged in
  checkAuth().then(user => { if (user) window.location.href = '/'; });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      window.location.href = '/';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
}

// ── Register Page ──────────────────────────────────────────────
if (document.body.id === 'register') {
  // Redirect to home if already logged in
  checkAuth().then(user => { if (user) window.location.href = '/'; });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      window.location.href = '/';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}
```

- [ ] **Step 5: Verify the app still loads locally**

```bash
npm start
```

Open `http://localhost:3000` in a browser. The "Login" button should appear in the header. Clicking "+ New Post" (editor) should redirect to `/login.html`.

- [ ] **Step 6: Commit**

```bash
git add public/app.js
git commit -m "feat: add auth state management and login/register page handlers"
```

---

## Task 10: Railway deployment

**Files:**
- No code changes — this is a Railway setup task.

- [ ] **Step 1: Push the branch to GitHub**

Ensure your repo is on GitHub. If it isn't yet:
```bash
# Create a new repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If it is already on GitHub, push the current branch:
```bash
git push origin feature/dev
# Then open a PR and merge to main, or push directly:
git checkout main && git merge feature/dev && git push origin main
```

- [ ] **Step 2: Create Railway project**

1. Go to [railway.app](https://railway.app) and sign up/login with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository. Railway will detect Node.js and deploy automatically.

- [ ] **Step 3: Add PostgreSQL plugin**

1. Inside your Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway creates a PostgreSQL instance and sets `DATABASE_URL` automatically in your service's environment.

- [ ] **Step 4: Set `SESSION_SECRET` environment variable**

1. Click on your web service in Railway → **Variables** tab.
2. Add: `SESSION_SECRET` = any long random string (e.g. generate with `openssl rand -hex 32` in your terminal).
3. Add: `NODE_ENV` = `production`

- [ ] **Step 5: Set the start command (if not auto-detected)**

Railway should auto-detect `npm start` from `package.json`. If it doesn't:
1. Go to service **Settings** → **Start Command** → set to `npm start`.

- [ ] **Step 6: Verify deployment**

1. Click the generated `*.railway.app` URL.
2. The blog home page should load.
3. Click **Login** → you should see the login form.
4. Click **Register** → create an account → you should be redirected to home with **+ New Post** and **Logout** visible.
5. Click **+ New Post** → editor should load.
6. Create a post → it should appear in the sidebar.
7. Click **Logout** → **+ New Post** should disappear, **Login** should reappear.
8. Try visiting `/editor.html` directly while logged out → should redirect to `/login.html`.

- [ ] **Step 7: Verify unauthenticated write is blocked**

```bash
curl -X POST https://YOUR_APP.railway.app/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test","body":"Should fail"}'
```

Expected: `{"error":"Authentication required"}` with HTTP 401.

---

## Environment Variables Reference

| Variable | Where set | Value |
|----------|-----------|-------|
| `DATABASE_URL` | Railway (auto) | PostgreSQL connection string |
| `SESSION_SECRET` | Railway (manual) | Long random string — keep secret |
| `NODE_ENV` | Railway (manual) | `production` |
| `PORT` | Railway (auto) | Set automatically, already used in server.js |
