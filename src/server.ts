import pool from "./db"; // ✅ Import your default pool from db.ts
import { createApp } from "./app";
import dotenv from "dotenv";

dotenv.config();

// ✅ Pass the real database pool instance down to your app wrapper
const app = createApp(pool);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running smoothly on port ${PORT}`);
});
