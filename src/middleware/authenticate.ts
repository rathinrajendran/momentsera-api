import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt";

/**
 * Ensures the incoming request provides a valid, unexpired Access Token.
 * Extends Express.Request to make user identity globally accessible in downstream handlers.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];

  // Expecting format: "Bearer <JWT_TOKEN>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token missing. Authentication required.",
    });
    return;
  }

  const decodedPayload = verifyAccessToken(token);

  if (!decodedPayload) {
    res.status(403).json({
      success: false,
      message: "Access token is invalid or has expired.",
    });
    return;
  }

  // Populate token payload details for downstream route use
  req.user = {
    id: decodedPayload.accountId,
    email: decodedPayload.email,
    role: decodedPayload.role,
  };

  next();
};

/**
 * Optional RBAC helper middleware to restrict endpoints by account role
 * Matches the enum('admin', 'user', 'guest') layout from your accounts table schema.
 */
export const authorizeRoles = (
  ...allowedRoles: Array<"admin" | "user" | "guest">
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required." });
      return;
    }

if (!allowedRoles.includes(req.user.role as any)) {
  res.status(403).json({
    success: false,
    message: "Forbidden: You do not have permission to access this resource.",
  });
  return;
}

    next();
  };
};
