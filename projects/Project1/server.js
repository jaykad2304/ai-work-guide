const express = require('express');
const path = require('path');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { pool, migrate } = require('./db');
const authRouter = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

// Trust Railway's proxy so secure cookies work over HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(rowToPost(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Run DB migration then start server
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Blog running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
