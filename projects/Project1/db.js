const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required in production');
  process.exit(1);
}

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

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
  `);

  // Migrate existing posts from JSON file (idempotent — skips duplicates)
  const dataFile = path.join(__dirname, 'data', 'posts.json');
  if (fs.existsSync(dataFile)) {
    try {
      const posts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const post of posts) {
          await client.query(
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
        await client.query('COMMIT');
        console.log(`Migrated ${posts.length} posts from JSON`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('JSON migration failed, skipping:', err.message);
    }
  }

  console.log('Database migration complete');
}

module.exports = { pool, migrate };
