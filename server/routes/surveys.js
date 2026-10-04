const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  const { title, description } = req.body;

  if (typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length < 3 || cleanTitle.length > 200) {
    return res.status(400).json({ error: "Title must be 3 to 200 characters" });
  }

  let cleanDescription = null;
  if (description !== undefined && description !== null) {
    if (typeof description !== "string" || description.length > 2000) {
      return res
        .status(400)
        .json({ error: "Description must be text up to 2000 characters" });
    }
    cleanDescription = description.trim() || null;
  }

  try {
    const result = await pool.query(
      "INSERT INTO surveys (owner_id, title, description) VALUES ($1, $2, $3) RETURNING id, title, description, status, closes_at, created_at",
      [req.user.id, cleanTitle, cleanDescription],
    );
    res.status(201).json({ survey: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, status, closes_at, created_at FROM surveys WHERE owner_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json({ surveys: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/:id", async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: "Survey not found" });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, description, status, closes_at, created_at FROM surveys WHERE id = $1 AND owner_id = $2",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Survey not found" });
    }
    res.json({ survey: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const STATUSES = ["draft", "open", "closed"];

router.patch("/:id", async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: "Survey not found" });
  }

  const { title, description, status } = req.body;

  if (
    title === undefined &&
    description === undefined &&
    status === undefined
  ) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  let cleanTitle = null;
  if (title !== undefined) {
    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      title.trim().length > 200
    ) {
      return res
        .status(400)
        .json({ error: "Title must be 3 to 200 characters" });
    }
    cleanTitle = title.trim();
  }

  let cleanDescription = null;
  if (description !== undefined) {
    if (typeof description !== "string" || description.length > 2000) {
      return res
        .status(400)
        .json({ error: "Description must be text up to 2000 characters" });
    }
    cleanDescription = description.trim();
  }

  let cleanStatus = null;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be draft, open or closed" });
    }
    cleanStatus = status;
  }

  try {
    const result = await pool.query(
      `UPDATE surveys
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status)
       WHERE id = $4 AND owner_id = $5
       RETURNING id, title, description, status, closes_at, created_at`,
      [cleanTitle, cleanDescription, cleanStatus, req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Survey not found" });
    }
    res.json({ survey: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: "Survey not found" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM surveys WHERE id = $1 AND owner_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Survey not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get('/:id/results', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  try {
    const s = await pool.query(
      'SELECT id, title, status FROM surveys WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (s.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    const survey = s.rows[0];

    const total = await pool.query(
      'SELECT COUNT(*)::int AS n FROM responses WHERE survey_id = $1',
      [survey.id]
    );

    const questions = await pool.query(
      'SELECT id, type, text, required, position FROM questions WHERE survey_id = $1 ORDER BY position',
      [survey.id]
    );

    const answered = await pool.query(
      `SELECT a.question_id, COUNT(DISTINCT a.response_id)::int AS n
       FROM answers a JOIN questions q ON q.id = a.question_id
       WHERE q.survey_id = $1
       GROUP BY a.question_id`,
      [survey.id]
    );

    const options = await pool.query(
      `SELECT o.id, o.question_id, o.label, COUNT(a.id)::int AS count
       FROM options o
       JOIN questions q ON q.id = o.question_id
       LEFT JOIN answers a ON a.option_id = o.id
       WHERE q.survey_id = $1
       GROUP BY o.id
       ORDER BY o.position`,
      [survey.id]
    );

    const ratings = await pool.query(
      `SELECT a.question_id, a.text_value, COUNT(*)::int AS count
       FROM answers a JOIN questions q ON q.id = a.question_id
       WHERE q.survey_id = $1 AND q.type = 'rating'
       GROUP BY a.question_id, a.text_value`,
      [survey.id]
    );

    const texts = await pool.query(
      `SELECT a.question_id, a.text_value
       FROM answers a
       JOIN responses r ON r.id = a.response_id
       JOIN questions q ON q.id = a.question_id
       WHERE q.survey_id = $1 AND q.type = 'short_text'
       ORDER BY r.submitted_at DESC`,
      [survey.id]
    );

    const results = questions.rows.map((q) => {
      const item = {
        id: q.id,
        type: q.type,
        text: q.text,
        required: q.required,
        position: q.position,
        answered: (answered.rows.find((a) => a.question_id === q.id) || { n: 0 }).n,
      };

      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        item.options = options.rows
          .filter((o) => o.question_id === q.id)
          .map((o) => ({ id: o.id, label: o.label, count: o.count }));
      } else if (q.type === 'rating') {
        const mine = ratings.rows.filter((r) => r.question_id === q.id);
        item.distribution = [1, 2, 3, 4, 5].map((n) => {
          const found = mine.find((r) => r.text_value === String(n));
          return { value: n, count: found ? found.count : 0 };
        });
        const count = item.distribution.reduce((sum, d) => sum + d.count, 0);
        const points = item.distribution.reduce((sum, d) => sum + d.value * d.count, 0);
        item.average = count > 0 ? Math.round((points / count) * 100) / 100 : null;
      } else {
        item.answers = texts.rows
          .filter((t) => t.question_id === q.id)
          .slice(0, 200)
          .map((t) => t.text_value);
      }

      return item;
    });

    res.json({
      survey: { id: survey.id, title: survey.title, status: survey.status },
      totalResponses: total.rows[0].n,
      questions: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
module.exports = router;
