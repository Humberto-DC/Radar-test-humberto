//lib\Db.ts
import { Pool } from "pg";

// garante que isso só rode no server
if (typeof window !== "undefined") {
  throw new Error("radarDb não pode ser importado no client");
}

const ssl =
  process.env.RADAR_DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false;

export const radarPool = new Pool({
  host: process.env.RADAR_DB_HOST,
  port: Number(process.env.RADAR_DB_PORT || 5432),
  database: process.env.RADAR_DB_NAME,
  user: process.env.RADAR_DB_USER,
  password: process.env.RADAR_DB_PASS,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

radarPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
