import { Router } from "express";
import {
  updateWishes,
  submitWish,
  getWishes,
  getMyWishes,
} from "../controllers/wishes.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

/* Editor */
router.patch("/events/:eventId/wishes", authMiddleware, updateWishes);

/* Live invite */
router.post("/invites/:eventKey/wishes", submitWish);

router.get("/invites/:eventKey/wishes", getWishes);

router.get("/account/wishes", authMiddleware, getMyWishes);
export default router;
