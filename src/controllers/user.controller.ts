import { Request, Response } from "express";
import pool from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/* ---------------------------------
   GET MY PROFILE
   GET /user/me
---------------------------------- */
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        id,
        full_name,
        email,
        phone,
        role,
        account_status,
        created_date,
        updated_date
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Account not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
}

/* ---------------------------------
   UPDATE MY PROFILE
   PUT /user/me
---------------------------------- */
export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { full_name, phone } = req.body;

    if (!full_name && !phone) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (full_name) {
      fields.push("full_name = ?");
      values.push(full_name);
    }

    if (phone) {
      fields.push("phone = ?");
      values.push(phone);
    }

    values.push(userId);

    await pool.query<ResultSetHeader>(
      `
      UPDATE accounts
      SET ${fields.join(", ")}, updated_date = NOW()
      WHERE id = ?
      `,
      values
    );

    // return updated profile
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        id,
        full_name,
        email,
        phone,
        role,
        account_status,
        created_date,
        updated_date
      FROM accounts
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    return res.json(rows[0]);
  } catch (err: any) {
    // phone duplicate error (if you have UNIQUE constraint)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Phone already exists" });
    }

    return res.status(500).json({ error: "Failed to update profile" });
  }
}

/* ---------------------------------
   GET MY EVENTS
   GET /user/me/events
---------------------------------- */
export async function getMyEvents(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        id,
        event_key,
        owner_id,
        event_type,
        status,
        invite_key,
        default_lang,
        stage,
        created_at,
        updated_at,
        expires_at,
        data_json
      FROM events
      WHERE owner_id = ?
      ORDER BY id DESC
      `,
      [userId]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load events" });
  }
}