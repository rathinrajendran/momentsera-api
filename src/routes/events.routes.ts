import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

import {
  upsertOnboardingEvent,
  publishEvent,
  getEventByKey,
  saveEventSection,
  deleteEvent,
  checkEventKeyAvailability,
  updateEventKey,
} from "../controllers/events.controller";

const router = Router();

/* ---------- PUBLIC ---------- */
router.get("/check-event-key/:eventKey", checkEventKeyAvailability);

router.get("/key/:event_key", getEventByKey);

/* ---------- PROTECTED ---------- */
router.post("/onboarding", authMiddleware, upsertOnboardingEvent);

router.patch("/:eventId/section", authMiddleware, saveEventSection);

router.post("/:eventId/publish", authMiddleware, publishEvent);

router.delete("/:eventId", authMiddleware, deleteEvent);

router.patch("/:eventId/event-key", authMiddleware, updateEventKey);

export default router;