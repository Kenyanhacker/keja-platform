const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { location, maxPrice, rentalType, sort = "popular" } = req.query;
  const values = [];
  const where = ["l.status = 'active'"];

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

router.post("/", requireAuth, requireRole("host"), async (req, res) => {
  const { title, description, location, price, rentalType, amenities = [], images = [] } = req.body;
  const result = await db.query(
    `INSERT INTO listings
      (host_id, title, description, location, price, rental_type, amenities, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [req.user.id, title, description, location, price, rentalType, amenities, images]
  );
  return res.status(201).json(result.rows[0]);
});

router.patch("/:id/availability", requireAuth, requireRole("host"), async (req, res) => {
  const { available } = req.body;
  const result = await db.query(
    "UPDATE listings SET is_available = $1 WHERE id = $2 AND host_id = $3 RETURNING *",
    [available, req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Listing not found" });
  return res.json(result.rows[0]);
});

module.exports = router;
