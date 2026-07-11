import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import eventsRoutes from "./routes/events.routes.js";
import accountsRoutes from "./routes/accounts.routes.js";
import draftsRoutes from "./routes/drafts.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import wishesRoutes from "./routes/wishes.routes.js";
import userRoutes from "./routes/user.routes.js";
import { authenticate } from "./auth/auth.middleware.js";
import invitesRoutes from "./routes/invites.routes";
import { createAuthRoutes } from "./auth/auth.routes";

dotenv.config();
// 1. Wrap the app initialization inside a function that takes dbPool
export function createApp(dbPool: any) {
  const app = express();

  /* ---------- CORS & MIDDLEWARE ---------- */
  const allowedOrigins = [
    "http://localhost:3000",
    "https://invite.momentsera.com",
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json());

  /* =================================================
     ROUTES
  ================================================= */
  app.use("/api/invites", invitesRoutes);

  // ✅ Passes the database pool down safely without any import path errors!
  app.use("/api/auth", createAuthRoutes(dbPool));

  app.use("/api/accounts", accountsRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/user", userRoutes);

  app.use("/api/drafts", authenticate, draftsRoutes);
  app.use("/api/gallery", authenticate, galleryRoutes);
  app.use("/api", wishesRoutes);

  /* ---------- STATIC UPLOADS & ERROR HANDLER ---------- */
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("❌ BACKEND ERROR:", err);
    res.status(500).json({
      error: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && { details: err.message }),
    });
  });

  return app;
}
