import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
} from "../controllers/user.controller";

const router = Router();

/* ---------- PROTECTED ---------- */
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me/events", authMiddleware, getMyEvents);

export default router;