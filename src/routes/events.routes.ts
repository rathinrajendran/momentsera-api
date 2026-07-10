import { Router } from "express";

import {
  upsertOnboardingEvent,
  publishEvent,
  getEventByKey,
  saveEventSection,
  deleteEvent,
  checkEventKeyAvailability,
  updateEventKey,
} from "../controllers/events.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

/* ---------- PUBLIC ---------- */
router.get("/check-event-key/:eventKey", checkEventKeyAvailability);

router.get("/key/:event_key", getEventByKey);

/* ---------- PROTECTED ---------- */
router.post("/onboarding", authenticate, upsertOnboardingEvent);

router.patch("/:eventId/section", authenticate, saveEventSection);

router.post("/:eventId/publish", authenticate, publishEvent);

router.delete("/:eventId", authenticate, deleteEvent);

router.patch("/:eventId/event-key", authenticate, updateEventKey);

export default router;