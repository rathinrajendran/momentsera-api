import { Router } from "express";
import {
  createDraft,
  updateDraft,
  listDrafts,
  createEventFromDraft,
} from "../controllers/drafts.controller";

const router = Router();

/* ---------- DRAFTS ---------- */
router.post("/", createDraft);
router.patch("/:draftId", updateDraft);
router.get("/", listDrafts);
router.post("/convert/:draftId", createEventFromDraft);


/* ---------- CONVERT ---------- */
router.post("/convert/:draftId", createEventFromDraft);

export default router;
