import { Router } from "express";
import {
  createAccount,
  getAccounts,
  checkAccountExists,
} from "../controllers/accounts.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

/* ---------- PUBLIC ---------- */
router.post("/", createAccount);          // Register
router.get("/check", checkAccountExists); // Email / phone check

/* ---------- PROTECTED ---------- */
router.get("/", authenticate, getAccounts);

export default router;
