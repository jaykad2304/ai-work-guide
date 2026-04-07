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

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
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

module.exports = router;
