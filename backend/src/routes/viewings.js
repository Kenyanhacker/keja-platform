const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/:listingId", requireAuth, async (req, res) => {
  const { fullName, phone, preferredDate, notes = "" } = req.body;
  if (!fullName || !phone || !preferredDate) {
    return res.status(400).json({ error: "Missing required viewing request fields" });
  }

  const listingResult = await db.query(
    `SELECT l.id
     FROM listings l
     JOIN users u ON u.id = l.host_id
     WHERE l.id = $1
       AND l.status = 'active'
       AND l.is_available = TRUE
       AND u.role = 'host'
       AND u.status = 'active'`,
    [req.params.listingId]
  );
  if (!listingResult.rows[0]) return res.status(404).json({ error: "Listing not found" });

  const result = await db.query(
    `INSERT INTO viewing_requests (listing_id, user_id, full_name, phone, preferred_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.params.listingId, req.user.id, fullName, phone, preferredDate, notes]
  );
  return res.status(201).json(result.rows[0]);
});

module.exports = router;
