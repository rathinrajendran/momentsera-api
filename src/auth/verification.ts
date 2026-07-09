import crypto from "crypto";

export async function generateEmailVerificationToken(
  db: any,
  accountId: number,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  await db.query(
    `INSERT INTO email_verifications (account_id, token, expires_at) VALUES (?, ?, ?)`,
    [accountId, token, expiresAt],
  );
  return token;
}

export async function generatePasswordResetToken(
  db: any,
  accountId: number,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 Hour

  await db.query(
    `INSERT INTO password_resets (account_id, token, expires_at) VALUES (?, ?, ?)`,
    [accountId, token, expiresAt],
  );
  return token;
}
