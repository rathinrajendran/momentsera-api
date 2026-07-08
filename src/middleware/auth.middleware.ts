import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type AuthPayload = JwtPayload & {
  id: number;
  role?: string;
};

const PUBLIC_ROUTES = [
  { method: "POST", path: "/api/accounts" },
  { method: "GET", path: "/api/accounts/check" },
  { method: "POST", path: "/api/events/onboarding" }, // ✅ correct
];

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isPublic = PUBLIC_ROUTES.some(
    r => r.method === req.method && req.path.startsWith(r.path)
  );

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Invalid authorization format",
    });
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
