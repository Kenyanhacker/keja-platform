const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/:listingId", requireAuth, requireRole("user"), async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be 1-5" });
  }

  const listingResult = await db.query("SELECT host_id FROM listings WHERE id = $1", [req.params.listingId]);
  if (!listingResult.rows[0]) return res.status(404).json({ error: "Listing not found" });

  const hostId = listingResult.rows[0].host_id;
  const result = await db.query(
    `INSERT INTO reviews (listing_id, host_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.params.listingId, hostId, req.user.id, rating, comment || ""]
  );
  return res.status(201).json(result.rows[0]);
});

module.exports = router;
