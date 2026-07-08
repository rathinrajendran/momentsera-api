// services/api/src/routes/invites.routes.ts
import { Router } from "express";
import {
  getInviteByKey,
  getInvites,
  getInvitesByCategory,
} from "../controllers/invites.controller";

const router = Router();

// GET /api/invites → catalog
router.get("/", getInvites);

// GET /api/invites/category/:eventType → filter by event type
router.get("/category/:eventType", getInvitesByCategory);

// GET /api/invites/:inviteKey → single invite detail
router.get("/:inviteKey", getInviteByKey);

export default router;
