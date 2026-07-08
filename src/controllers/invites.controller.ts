import { Request, Response } from "express";
import pool from "../db";

/* ---------------------------------
   GET ALL ACTIVE INVITES
---------------------------------- */
export async function getInvites(req: Request, res: Response) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM event_invites WHERE is_active = 1`,
    );
    res.json(rows);
  } catch (error: any) {
    console.error("🔥 getInvites error:", error);

    res.status(500).json({
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
}

/* ---------------------------------
   GET INVITES BY EVENT CATEGORY
---------------------------------- */
export async function getInvitesByCategory(req: Request, res: Response) {
  const { eventType } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT DISTINCT t.*
      FROM event_invites t
      INNER JOIN invite_event_support tes
        ON tes.invite_id = t.id
      WHERE TRIM(LOWER(tes.event_type)) = TRIM(LOWER(?))
        AND t.is_active = 1
      `,
      [eventType]
    );

    res.json(rows);
  } catch (error) {
    console.error("🔥 getInvitesByCategory error:", error);
    res.status(500).json({ error: "Failed to fetch invites by category" });
  }
}
/* ---------------------------------
   GET INVITE BY KEY
---------------------------------- */
export async function getInviteByKey(req: Request, res: Response) {
  const { inviteKey } = req.params;

  try {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM event_invites WHERE invite_key = ? AND is_active = 1`,
      [inviteKey]
    );

    const invite = rows[0];
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    const [eventTypes] = await pool.query<any[]>(
      `SELECT event_type FROM invite_event_support WHERE invite_id = ?`,
      [invite.id]
    );

    res.json({
      ...invite,
      supported_events: eventTypes.map((e) => e.event_type),
      default_settings: invite.default_settings
        ? JSON.parse(invite.default_settings)
        : {},
    });
  } catch (error) {
    console.error("🔥 getInviteByKey error:", error);
    res.status(500).json({ error: "Failed to fetch invite" });
  }
}
