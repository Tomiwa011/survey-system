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
module.exports = router;
