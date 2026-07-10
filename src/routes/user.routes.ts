import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getMyEvents,
} from "../controllers/user.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

/* ---------- PROTECTED ---------- */
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.get("/me/events", authenticate, getMyEvents);

export default router;