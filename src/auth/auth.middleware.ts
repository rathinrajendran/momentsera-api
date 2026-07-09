import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { ZodSchema } from "zod";
// Extends express Request type to carry the authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number; // Changed from accountId to id
        email: string;
        role: "admin" | "user" | "guest";
      };
    }
  }
}

export const validateBody =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ status: "error", errors: error.errors });
    }
  };
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: "Access token missing" });
    return;
  }

  const decoded = verifyAccessToken(token) as any;
  if (!decoded) {
    res.status(403).json({ message: "Invalid or expired access token" });
    return;
  }

  req.user = {
    id: decoded.id || decoded.accountId, // Accommodates both conventions cleanly
    email: decoded.email,
    role: decoded.role,
  };
  next();
};
