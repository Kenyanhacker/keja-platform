const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { newDb } = require("pg-mem");

function createPgMemPool() {
  const db = newDb();
  const schemaSql = fs.readFileSync(path.resolve(__dirname, "../../sql/schema.sql"), "utf8");
  const seedSql = fs.readFileSync(path.resolve(__dirname, "../../sql/seed.sql"), "utf8");
  db.public.none(schemaSql);
  db.public.none(seedSql);
  const { Pool: MemPool } = db.adapters.createPg();
  return new MemPool();
}

const usePgMem = process.env.USE_PGMEM === "true" || !process.env.DATABASE_URL;
const pool = usePgMem
  ? createPgMemPool()
  : new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  query: (text, params) => pool.query(text, params)
};
