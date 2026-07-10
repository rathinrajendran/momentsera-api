import { Router } from "express";
import {
  updateWishes,
  submitWish,
  getWishes,
  getMyWishes,
} from "../controllers/wishes.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

/* Editor */
router.patch("/events/:eventId/wishes", authenticate, updateWishes);

/* Live invite */
router.post("/invites/:eventKey/wishes", submitWish);

router.get("/invites/:eventKey/wishes", getWishes);

router.get("/account/wishes", authenticate, getMyWishes);
export default router;
