const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = ['short_text', 'single_choice', 'multiple_choice', 'rating'];
const CHOICE_TYPES = ['single_choice', 'multiple_choice'];

router.use(requireAuth);

// Every route in this file first checks that the survey exists AND belongs to you
router.use(async (req, res, next) => {
  if (!UUID_RE.test(req.params.surveyId)) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  try {
    const result = await pool.query(
      'SELECT id FROM surveys WHERE id = $1 AND owner_id = $2',
      [req.params.surveyId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  const { type, text, required, options } = req.body;

  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type must be short_text, single_choice, multiple_choice or rating' });
  }
  if (typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 500) {
    return res.status(400).json({ error: 'Question text must be 1 to 500 characters' });
  }
  if (required !== undefined && typeof required !== 'boolean') {
    return res.status(400).json({ error: 'Required must be true or false' });
  }

  let cleanOptions = [];
  if (CHOICE_TYPES.includes(type)) {
    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return res.status(400).json({ error: 'Choice questions need 2 to 10 options' });
    }
    for (const o of options) {
      if (typeof o !== 'string' || o.trim().length < 1 || o.trim().length > 200) {
        return res.status(400).json({ error: 'Each option must be 1 to 200 characters' });
      }
    }
    cleanOptions = options.map((o) => o.trim());
  } else if (options !== undefined && !(Array.isArray(options) && options.length === 0)) {
    return res.status(400).json({ error: 'Only choice questions can have options' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const q = await client.query(
      `INSERT INTO questions (survey_id, type, text, required, position)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(position), 0) + 1 FROM questions WHERE survey_id = $1))
       RETURNING id, type, text, required, position`,
      [req.params.surveyId, type, text.trim(), required === true]
    );

    const savedOptions = [];
    for (let i = 0; i < cleanOptions.length; i++) {
      const o = await client.query(
        'INSERT INTO options (question_id, label, position) VALUES ($1, $2, $3) RETURNING id, label, position',
        [q.rows[0].id, cleanOptions[i], i + 1]
      );
      savedOptions.push(o.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ question: { ...q.rows[0], options: savedOptions } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.type, q.text, q.required, q.position,
              COALESCE(
                json_agg(json_build_object('id', o.id, 'label', o.label, 'position', o.position) ORDER BY o.position)
                  FILTER (WHERE o.id IS NOT NULL),
                '[]'
              ) AS options
       FROM questions q
       LEFT JOIN options o ON o.question_id = q.id
       WHERE q.survey_id = $1
       GROUP BY q.id
       ORDER BY q.position`,
      [req.params.surveyId]
    );
    res.json({ questions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
router.patch('/:questionId', async (req, res) => {
  if (!UUID_RE.test(req.params.questionId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const { text, required } = req.body;

  if (text === undefined && required === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  let cleanText = null;
  if (text !== undefined) {
    if (typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 500) {
      return res.status(400).json({ error: 'Question text must be 1 to 500 characters' });
    }
    cleanText = text.trim();
  }

  let cleanRequired = null;
  if (required !== undefined) {
    if (typeof required !== 'boolean') {
      return res.status(400).json({ error: 'Required must be true or false' });
    }
    cleanRequired = required;
  }

  try {
    const result = await pool.query(
      `UPDATE questions
       SET text = COALESCE($1, text),
           required = COALESCE($2, required)
       WHERE id = $3 AND survey_id = $4
       RETURNING id, type, text, required, position`,
      [cleanText, cleanRequired, req.params.questionId, req.params.surveyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ question: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/:questionId', async (req, res) => {
  if (!UUID_RE.test(req.params.questionId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      'DELETE FROM questions WHERE id = $1 AND survey_id = $2 RETURNING position',
      [req.params.questionId, req.params.surveyId]
    );
    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found' });
    }

    await client.query(
      'UPDATE questions SET position = position - 1 WHERE survey_id = $1 AND position > $2',
      [req.params.surveyId, deleted.rows[0].position]
    );

    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  } finally {
    client.release();
  }
});
module.exports = router;