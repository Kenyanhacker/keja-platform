const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { fullName, email, password, role = "user" } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!["user", "host"].includes(role)) {
    return res.status(400).json({ error: "Role must be user or host" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role",
      [fullName, email.toLowerCase(), hash, role]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email is already registered" });
    }
    throw err;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  if (user.status !== "active") return res.status(403).json({ error: "Account suspended" });

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  return res.json({
    token,
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await db.query(
    "SELECT id, full_name, email, role, status FROM users WHERE id = $1",
    [req.user.id]
  );
  const user = result.rows[0];
  if (!user || user.status !== "active") {
    return res.status(401).json({ error: "Invalid session" });
  }
  return res.json({
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
  });
});

module.exports = router;
