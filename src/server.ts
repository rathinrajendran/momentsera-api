import "dotenv/config";

import app from "./app";
import pool from "./db";

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});

app.get("/db-test", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
    });
  }
});

app.get("/env-test", (_req, res) => {
  res.json({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    passwordLength: process.env.DB_PASSWORD?.length,
  });
});
app.get("/env-debug", (_req, res) => {
  res.json({
    user: JSON.stringify(process.env.DB_USER),
    database: JSON.stringify(process.env.DB_NAME),
    host: JSON.stringify(process.env.DB_HOST),
    passwordLength: process.env.DB_PASSWORD?.length,
    passwordStartsWith: process.env.DB_PASSWORD?.charCodeAt(0),
    passwordEndsWith: process.env.DB_PASSWORD?.charCodeAt(
      process.env.DB_PASSWORD.length - 1,
    ),
  });
});