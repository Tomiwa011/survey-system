const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later' },
});

async function loadOpenSurvey(id) {
  if (!UUID_RE.test(id)) return { status: 404, error: 'Survey not found' };

  const s = await pool.query(
    'SELECT id, title, description, status, closes_at FROM surveys WHERE id = $1',
    [id]
  );
  const survey = s.rows[0];

  if (!survey || survey.status === 'draft') {
    return { status: 404, error: 'Survey not found' };
  }
  const expired = survey.closes_at && new Date(survey.closes_at) <= new Date();
  if (survey.status === 'closed' || expired) {
    return { status: 410, error: 'This survey is closed' };
  }
  return { survey };
}

async function loadQuestions(surveyId) {
  const q = await pool.query(
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
    [surveyId]
  );
  return q.rows;
}

router.get('/surveys/:id', async (req, res) => {
  try {
    const found = await loadOpenSurvey(req.params.id);
    if (found.error) return res.status(found.status).json({ error: found.error });

    const questions = await loadQuestions(found.survey.id);
    res.json({
      survey: { id: found.survey.id, title: found.survey.title, description: found.survey.description },
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/surveys/:id/responses', submitLimiter, async (req, res) => {
  const bad = (message, extra = {}) => res.status(400).json({ error: message, ...extra });

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length > 100) {
    return bad('Answers must be a list');
  }

  try {
    const found = await loadOpenSurvey(req.params.id);
    if (found.error) return res.status(found.status).json({ error: found.error });

    const questions = await loadQuestions(found.survey.id);
    const validQuestionIds = new Set(questions.map((q) => q.id));

    const byQuestion = new Map();
    for (const a of answers) {
      if (!a || typeof a.questionId !== 'string' || byQuestion.has(a.questionId)) {
        return bad('Invalid answers');
      }
      if (!validQuestionIds.has(a.questionId)) {
        return bad('Invalid answers');
      }
      byQuestion.set(a.questionId, a);
    }

    const rows = [];

    for (const q of questions) {
      const a = byQuestion.get(q.id);
      let answered = false;

      if (a && q.type === 'short_text') {
        if (a.value != null && typeof a.value !== 'string') return bad('Invalid answers');
        const v = (a.value || '').trim();
        if (v.length > 2000) return bad('Text answers must be 2000 characters or fewer');
        if (v) {
          rows.push({ questionId: q.id, optionId: null, textValue: v });
          answered = true;
        }
      } else if (a && q.type === 'rating') {
        if (a.value != null && a.value !== '') {
          const n = Number(a.value);
          if (!Number.isInteger(n) || n < 1 || n > 5) {
            return bad('Rating must be a whole number from 1 to 5');
          }
          rows.push({ questionId: q.id, optionId: null, textValue: String(n) });
          answered = true;
        }
      } else if (a) {
        const ids = a.optionIds;
        if (ids != null && !Array.isArray(ids)) return bad('Invalid answers');
        if (ids && ids.length > 0) {
          const optionSet = new Set(q.options.map((o) => o.id));
          const unique = new Set(ids);
          if (unique.size !== ids.length || !ids.every((id) => typeof id === 'string' && optionSet.has(id))) {
            return bad('Invalid option selected');
          }
          if (q.type === 'single_choice' && ids.length !== 1) {
            return bad('Choose only one option');
          }
          for (const id of ids) {
            rows.push({ questionId: q.id, optionId: id, textValue: null });
          }
          answered = true;
        }
      }

      if (q.required && !answered) {
        return bad('Please answer all required questions', { questionId: q.id });
      }
    }

    if (rows.length === 0) {
      return bad('Please answer at least one question');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(
        'INSERT INTO responses (survey_id) VALUES ($1) RETURNING id',
        [found.survey.id]
      );
      for (const row of rows) {
        await client.query(
          'INSERT INTO answers (response_id, question_id, option_id, text_value) VALUES ($1, $2, $3, $4)',
          [r.rows[0].id, row.questionId, row.optionId, row.textValue]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json({ message: 'Thank you for your response' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;