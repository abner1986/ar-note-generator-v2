const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const JWT_SECRET = process.env.JWT_SECRET;

// ---------- Public endpoints ----------
app.get('/api/test', (req, res) => res.json({ message: 'Server running' }));

app.get('/api/all-denial-codes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT code, description, code_type, is_callable, priority, quick_reason, code_family
      FROM (
        SELECT code, description, 'CARC' as code_type, is_callable, priority, quick_reason, code_family FROM carc_codes
        UNION ALL
        SELECT code, description, 'RARC' as code_type, is_callable, priority, quick_reason, code_family FROM rarc_codes
        UNION ALL
        SELECT code, description, 'OTHER' as code_type, is_callable, priority, quick_reason, code_family FROM other_denial_codes
      ) AS all_codes
      ORDER BY code_type, code
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/denial/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.code, c.description, c.resolution, c.is_callable, c.priority, c.quick_reason, c.code_family,
              cat.category_name, cat.workflow_type, cat.typical_actions, 'CARC' as code_type
       FROM carc_codes c
       LEFT JOIN denial_categories cat ON c.category_id = cat.id
       WHERE c.code = $1`,
      [code]
    );
    if (result.rows.length) return res.json(result.rows[0]);
    // ... similar for rarc and other tables (add if needed)
    res.status(404).json({ error: 'Code not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Authentication ----------
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (existing.rows.length) return res.status(409).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email',
      [username, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT id, username, email, password_hash FROM users WHERE username=$1', [username]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Protected example (optional) ----------
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Protect the all-denial-codes endpoint if you wish – but leave open for now.

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));