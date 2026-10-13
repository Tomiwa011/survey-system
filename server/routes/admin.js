const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(requireAuth, requireRole('admin'));

router.get('/ping', (req, res) => {
  res.json({ message: 'Welcome, admin' });
});

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users)::int AS users,
         (SELECT COUNT(*) FROM surveys)::int AS surveys,
         (SELECT COUNT(*) FROM responses)::int AS responses,
         (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days')::int AS users_7d,
         (SELECT COUNT(*) FROM surveys WHERE created_at >= NOW() - INTERVAL '7 days')::int AS surveys_7d,
         (SELECT COUNT(*) FROM responses WHERE submitted_at >= NOW() - INTERVAL '7 days')::int AS responses_7d`
    );
    res.json({ stats: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/users', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              COUNT(s.id)::int AS survey_count
       FROM users u
       LEFT JOIN surveys s ON s.owner_id = u.id
       WHERE u.name ILIKE $1 OR u.email ILIKE $1
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT 100`,
      [pattern]
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.patch('/users/:id', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (typeof req.body.is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be true or false' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own account' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = $1
       WHERE id = $2 AND role = 'user'
       RETURNING id, name, email, role, is_active`,
      [req.body.is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/surveys', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.status, s.created_at,
              u.name AS owner_name, u.email AS owner_email,
              (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id)::int AS response_count
       FROM surveys s
       JOIN users u ON u.id = s.owner_id
       ORDER BY s.created_at DESC
       LIMIT 200`
    );
    res.json({ surveys: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/surveys/:id/close', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  try {
    const result = await pool.query(
      `UPDATE surveys SET status = 'closed' WHERE id = $1 RETURNING id, title, status`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.json({ survey: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/surveys/:id', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  try {
    const result = await pool.query('DELETE FROM surveys WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const perDay = await pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(r.id)::int AS count
       FROM generate_series(
              date_trunc('day', NOW()) - INTERVAL '29 days',
              date_trunc('day', NOW()),
              INTERVAL '1 day'
            ) AS d
       LEFT JOIN responses r
         ON r.submitted_at >= d AND r.submitted_at < d + INTERVAL '1 day'
       GROUP BY d
       ORDER BY d`
    );

    const statuses = await pool.query(
      'SELECT status, COUNT(*)::int AS count FROM surveys GROUP BY status'
    );
    const statusCounts = ['draft', 'open', 'closed'].map((s) => {
      const found = statuses.rows.find((r) => r.status === s);
      return { status: s, count: found ? found.count : 0 };
    });

    const top = await pool.query(
      `SELECT s.title, COUNT(r.id)::int AS responses
       FROM surveys s
       LEFT JOIN responses r ON r.survey_id = s.id
       GROUP BY s.id
       ORDER BY responses DESC, s.created_at DESC
       LIMIT 5`
    );

    res.json({
      responsesPerDay: perDay.rows,
      statusCounts,
      topSurveys: top.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;