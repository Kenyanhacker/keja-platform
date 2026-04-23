const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/users", async (_req, res) => {
  const result = await db.query("SELECT id, full_name, email, role, status, created_at FROM users ORDER BY created_at DESC");
  return res.json(result.rows);
});

router.get("/listings", async (_req, res) => {
  const result = await db.query(
    `SELECT l.*, u.full_name AS host_name
     FROM listings l
     JOIN users u ON u.id = l.host_id
     ORDER BY l.created_at DESC`
  );
  return res.json(result.rows);
});

router.get("/chats", async (_req, res) => {
  const result = await db.query("SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 500");
  return res.json(result.rows);
});

router.get("/analytics", async (_req, res) => {
  const [users, hosts, listings, chats] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'"),
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'host'"),
    db.query("SELECT COUNT(*)::int AS count FROM listings"),
    db.query("SELECT COUNT(*)::int AS count FROM chat_messages")
  ]);
  return res.json({
    users: users.rows[0].count,
    hosts: hosts.rows[0].count,
    listings: listings.rows[0].count,
    chats: chats.rows[0].count
  });
});

router.patch("/users/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended", "banned"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const result = await db.query("UPDATE users SET status = $1 WHERE id = $2 RETURNING id, status", [status, req.params.id]);
  return res.json(result.rows[0]);
});

router.patch("/listings/:id/status", async (req, res) => {
  const { status } = req.body;
  const result = await db.query("UPDATE listings SET status = $1 WHERE id = $2 RETURNING id, status", [status, req.params.id]);
  return res.json(result.rows[0]);
});

module.exports = router;
