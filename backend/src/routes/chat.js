const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/:listingId", requireAuth, async (req, res) => {
  const result = await db.query(
    `SELECT c.*, u.full_name AS sender_name
     FROM chat_messages c
     JOIN users u ON u.id = c.sender_id
     WHERE c.listing_id = $1
     ORDER BY c.created_at ASC`,
    [req.params.listingId]
  );
  return res.json(result.rows);
});

router.post("/:listingId", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const listing = await db.query("SELECT host_id FROM listings WHERE id = $1", [req.params.listingId]);
  if (!listing.rows[0]) return res.status(404).json({ error: "Listing not found" });

  const hostId = listing.rows[0].host_id;
  const receiverId = req.user.id === hostId ? null : hostId;
  const result = await db.query(
    `INSERT INTO chat_messages (listing_id, sender_id, receiver_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.params.listingId, req.user.id, receiverId, message]
  );
  return res.status(201).json(result.rows[0]);
});

module.exports = router;
