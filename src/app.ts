import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import eventsRoutes from "./routes/events.routes.js";
import accountsRoutes from "./routes/accounts.routes.js";
import authRoutes from "./routes/auth.routes.js";
import draftsRoutes from "./routes/drafts.routes.js";
import invitesRoutes from "./routes/invites.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import wishesRoutes from "./routes/wishes.routes.js";
import userRoutes from "./routes/user.routes.js";
import authMiddleware from "./middleware/auth.middleware.js";

import paymentsRoute from "./routes/payments.js";
import webhookRoute from "./routes/webhook.js"; // ✅ FIXED

dotenv.config();

const app = express();

/* ---------- ENV VALIDATION ---------- */
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined");
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not defined");
  process.exit(1);
}

/* ---------- CORS ---------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =================================================
   🔴 STRIPE WEBHOOK (MUST BE BEFORE JSON PARSER)
================================================= */
// app.use(
//   "/api/payments/webhook",
//   express.raw({ type: "application/json" }),
//   webhookRoute
// );

/* ---------- BODY PARSER ---------- */
app.use(express.json());

/* =================================================
   PUBLIC ROUTES
================================================= */
app.use("/api/auth", authRoutes);
app.use("/api/invites", invitesRoutes);

/* =================================================
   MIXED ROUTES
================================================= */
app.use("/api/accounts", accountsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/user", userRoutes);

/* =================================================
   PROTECTED ROUTES
================================================= */
app.use("/api/drafts", authMiddleware, draftsRoutes);
app.use("/api/gallery", authMiddleware, galleryRoutes);
app.use("/api", wishesRoutes);

/* =================================================
   💳 PAYMENTS (NORMAL API)
================================================= */
// app.use("/api/payments", paymentsRoute); // ✅ FIXED

/* ---------- STATIC UPLOADS ---------- */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ---------- ERROR HANDLER ---------- */
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ BACKEND ERROR:", err);

  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && {
      details: err.message,
    }),
  });
});

export default app;