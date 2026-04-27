const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { location, maxPrice, rentalType, sort = "popular" } = req.query;
  const values = [];
  const where = [
    "l.status = 'active'",
    "l.is_available = TRUE",
    "u.role = 'host'",
    "u.status = 'active'"
  ];

  if (location) {
    values.push(location);
    where.push(`l.location = $${values.length}`);
  }
  if (maxPrice) {
    values.push(Number(maxPrice));
    where.push(`l.price <= $${values.length}`);
  }
  if (rentalType) {
    values.push(rentalType);
    where.push(`l.rental_type = $${values.length}`);
  }

  let orderBy = "l.popularity_score DESC";
  if (sort === "low-price") orderBy = "l.price ASC";
  if (sort === "high-price") orderBy = "l.price DESC";
  if (sort === "newest") orderBy = "l.created_at DESC";

  const query = `
    SELECT l.*, u.full_name AS host_name
    FROM listings l
    JOIN users u ON u.id = l.host_id
    WHERE ${where.join(" AND ")}
    ORDER BY ${orderBy}
  `;
  const result = await db.query(query, values);
  return res.json(result.rows);
});

router.get("/stats", async (_req, res) => {
  const [totalHouses, availableHouses, hosts, users] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS count
       FROM listings l
       JOIN users u ON u.id = l.host_id
       WHERE l.status = 'active' AND u.role = 'host' AND u.status = 'active'`
    ),
    db.query(
      `SELECT COUNT(*)::int AS count
       FROM listings l
       JOIN users u ON u.id = l.host_id
       WHERE l.status = 'active' AND l.is_available = TRUE AND u.role = 'host' AND u.status = 'active'`
    ),
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'host' AND status = 'active'"),
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user' AND status = 'active'")
  ]);

  return res.json({
    totalHouses: totalHouses.rows[0].count,
    availableHouses: availableHouses.rows[0].count,
    hosts: hosts.rows[0].count,
    users: users.rows[0].count
  });
});

router.post("/", requireAuth, requireRole("host", "admin"), async (req, res) => {
  const {
    title,
    description,
    location,
    price,
    rentalType,
    amenities = [],
    images = [],
    hostId
  } = req.body;
  if (!title || !location || !price || !rentalType) {
    return res.status(400).json({ error: "Missing required listing fields" });
  }
  const targetHostId = req.user.role === "admin" ? Number(hostId) : req.user.id;
  if (!targetHostId) {
    return res.status(400).json({ error: "Host selection is required" });
  }
  const hostResult = await db.query("SELECT id, role, status FROM users WHERE id = $1", [targetHostId]);
  if (!hostResult.rows[0] || hostResult.rows[0].role !== "host" || hostResult.rows[0].status !== "active") {
    return res.status(400).json({ error: "Selected host is invalid" });
  }
  const result = await db.query(
    `INSERT INTO listings
      (host_id, title, description, location, price, rental_type, amenities, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [targetHostId, title, description || "", location, Number(price), rentalType, amenities, images]
  );
  return res.status(201).json(result.rows[0]);
});

router.patch("/:id/availability", requireAuth, requireRole("host", "admin"), async (req, res) => {
  const { available } = req.body;
  const query = req.user.role === "admin"
    ? "UPDATE listings SET is_available = $1 WHERE id = $2 RETURNING *"
    : "UPDATE listings SET is_available = $1 WHERE id = $2 AND host_id = $3 RETURNING *";
  const params = req.user.role === "admin"
    ? [available, req.params.id]
    : [available, req.params.id, req.user.id];
  const result = await db.query(query, params);
  if (!result.rows[0]) return res.status(404).json({ error: "Listing not found" });
  return res.json(result.rows[0]);
});

module.exports = router;
