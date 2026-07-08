import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  createAccount,
  getAccounts,
  checkAccountExists,
} from "../controllers/accounts.controller";

const router = Router();

/* ---------- PUBLIC ---------- */
router.post("/", createAccount);          // Register
router.get("/check", checkAccountExists); // Email / phone check

/* ---------- PROTECTED ---------- */
router.get("/", authMiddleware, getAccounts);

export default router;
