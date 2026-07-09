import { Request, Response, NextFunction } from "express";

/**
 * Route protection middleware that checks the user's validation state
 * against the database criteria (email_verified, account_status).
 */
export function requireVerified(dbPool: any) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Ensure the authenticate middleware ran before this step
      if (!req.user || !req.user.id) {
        res
          .status(401)
          .json({ success: false, message: "Unauthorized. Please sign in." });
        return;
      }

      // Query verification and status indicators from your exact database schema
      const [rows] = await dbPool.query(
        "SELECT email_verified, account_status FROM accounts WHERE id = ? LIMIT 1",
        [req.user.id],
      );

      const accounts = rows as any[];

      if (accounts.length === 0) {
        res.status(404).json({ success: false, message: "Account not found." });
        return;
      }

      const account = accounts[0];

      // 1. Guard against unverified email flows
      if (account.email_verified !== 1) {
        res.status(403).json({
          success: false,
          code: "EMAIL_UNVERIFIED",
          message:
            "Access denied. Please verify your email address to continue.",
        });
        return;
      }

      // 2. Guard against suspended, pending, or archived configurations
      if (account.account_status !== "active") {
        res.status(403).json({
          success: false,
          code: "ACCOUNT_NOT_ACTIVE",
          message: `Access denied. Your account status is currently: ${account.account_status}.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error within verification enforcement middleware:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Internal server error processing security controls.",
        });
    }
  };
}
