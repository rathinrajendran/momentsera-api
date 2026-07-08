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
