const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, requireRole("host"), async (req, res) => {
  const listings = await db.query("SELECT * FROM listings WHERE host_id = $1 ORDER BY created_at DESC", [req.user.id]);
  const reviews = await db.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.host_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  return res.json({ listings: listings.rows, reviews: reviews.rows });
});

module.exports = router;
