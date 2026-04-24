require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const authRoutes = require("./routes/auth");
const listingsRoutes = require("./routes/listings");
const hostRoutes = require("./routes/hosts");
const chatRoutes = require("./routes/chat");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow browserless tools and same-origin calls
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin: " + origin));
    }
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  await db.query("SELECT 1");
  return res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/hosts", hostRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API running on port ${process.env.PORT || 4000}`);
});
