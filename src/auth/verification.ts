import crypto from "crypto";

/**
 * Generate a cryptographically secure random token.
 */
function createSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function generateEmailVerificationToken(
  db: any,
  accountId: number,
): Promise<string> {
  const token = createSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  await db.query(
    `
    DELETE FROM email_verifications
    WHERE account_id = ?
    `,
    [accountId],
  );

  await db.query(
    `
    INSERT INTO email_verifications
    (account_id, token, expires_at)
    VALUES (?, ?, ?)
    `,
    [accountId, token, expiresAt],
  );

  return token;
}

export async function generatePasswordResetToken(
  db: any,
  accountId: number,
): Promise<string> {
  const token = createSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

  await db.query(
    `
    DELETE FROM password_resets
    WHERE account_id = ?
    `,
    [accountId],
  );

  await db.query(
    `
    INSERT INTO password_resets
    (account_id, token, expires_at)
    VALUES (?, ?, ?)
    `,
    [accountId, token, expiresAt],
  );

  return token;
}
