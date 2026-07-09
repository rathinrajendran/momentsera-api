import crypto from "crypto";
import { RowDataPacket } from "mysql2";

export interface Session {
  id: number;
  account_id: number;
  refresh_token_hash: string;
  device?: string;
  ip?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date | null;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  db: any,
  accountId: number,
  data: { device?: string; ip?: string; userAgent?: string },
): Promise<string> {
  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  await db.query(
    `INSERT INTO sessions (account_id, refresh_token_hash, device, ip, user_agent, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      accountId,
      tokenHash,
      data.device || null,
      data.ip || null,
      data.userAgent || null,
      expiresAt,
    ],
  );

  return rawRefreshToken;
}

export async function findValidSession(
  db: any,
  token: string,
): Promise<Session | null> {
  const tokenHash = hashToken(token);
  const [rows] = await db.query(
    `SELECT * FROM sessions WHERE refresh_token_hash = ? AND expires_at > NOW() AND revoked_at IS NULL LIMIT 1`,
    [tokenHash],
  );
  const sessions = rows as Session[];
  return sessions.length > 0 ? sessions[0] : null;
}

export async function revokeSession(db: any, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.query(
    `UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = ?`,
    [tokenHash],
  );
}
