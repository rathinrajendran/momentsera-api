import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "storeinvites_auth";

export interface AccessTokenPayload {
  accountId: number;
  email: string;
  role: "admin" | "user" | "guest";
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}
