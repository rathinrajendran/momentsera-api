import { Request, Response } from "express";
import pool from "../db";

/* ---------------------------------
   UPDATE WISHES SETTINGS (EDITOR)
---------------------------------- */
export async function updateWishes(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.eventId);
    const wishes = req.body;

    if (!eventId || typeof wishes !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await pool.query(
      `
      UPDATE events
      SET data_json = JSON_MERGE_PATCH(
        COALESCE(data_json, '{}'),
        JSON_OBJECT('wishes', ?)
      )
      WHERE id = ?
      `,
      [JSON.stringify(wishes), eventId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE WISHES ERROR:", err);
    res.status(500).json({ error: "Failed to update wishes" });
  }
}

/* ---------------------------------
   SUBMIT WISH (LIVE INVITE)
---------------------------------- */

export async function submitWish(req: Request, res: Response) {
  try {
    const eventKey = req.params.eventKey;
    const { wishesFrom, phone, wishes, wishesType } = req.body;
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;

    if (!wishesFrom || !phone || !wishesType || !phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid wish data" });
    }

    const [[row]] = await pool.query<any[]>(
      `
      SELECT id, data_json
      FROM events
      WHERE event_key = ?
      `,
      [eventKey],
    );

    if (!row) {
      return res.status(404).json({ error: "Event not found" });
    }

    // ✅ SAFE JSON PARSE
    const dataJson =
      typeof row.data_json === "string"
        ? JSON.parse(row.data_json)
        : row.data_json;

    const wishesConfig = dataJson?.wishes;

    if (!wishesConfig?.enabled) {
      return res.status(403).json({ error: "Wishes disabled" });
    }

    const limit = wishesConfig.limit ?? 10;

    const [[{ count }]] = await pool.query<any[]>(
      `
      SELECT COUNT(*) AS count
      FROM event_wishes
      WHERE event_id = ?
      `,
      [row.id],
    );

    if (count >= limit) {
      return res.status(403).json({ error: "Wishes limit reached" });
    }

    const [[existingWish]] = await pool.query<any[]>(
      `
    SELECT id
    FROM event_wishes
    WHERE event_id = ?
      AND phone = ?
    LIMIT 1
    `,
      [row.id, phone],
    );

    if (existingWish) {
      return res.status(409).json({
        error: "Phone number already submitted a wish",
      });
    }

    await pool.query(
      `
      INSERT INTO event_wishes
        (event_id,
  wishes_from,
  phone,
  wishes,
  wishes_type)
      VALUES (?, ?, ?, ?, ?)
      `,
      [row.id, wishesFrom, phone, wishes ?? null, wishesType],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("SUBMIT WISH ERROR:", err);
    res.status(500).json({ error: "Phone number already submitted a wish" });
  }
}
/* ---------------------------------
   GET WISHES (LIVE INVITE)
---------------------------------- */
export async function getWishes(req: Request, res: Response) {
  try {
    const eventKey = req.params.eventKey;

    const [[event]] = await pool.query<any[]>(
      `
      SELECT id, data_json
      FROM events
      WHERE event_key = ?
      `,
      [eventKey],
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const dataJson =
      typeof event.data_json === "string"
        ? JSON.parse(event.data_json)
        : event.data_json;

    if (!dataJson?.wishes?.enabled) {
      return res.json([]); // wishes disabled → empty list
    }

    const [rows] = await pool.query<any[]>(
      `
      SELECT
        id,
        wishes_from,
        wishes,
        wishes_type,
        created_at
      FROM event_wishes
      WHERE event_id = ?
      ORDER BY created_at DESC
      `,
      [event.id],
    );

    res.json(rows);
  } catch (err) {
    console.error("GET WISHES ERROR:", err);
    res.status(500).json({ error: "Failed to load wishes" });
  }
}

export async function getMyWishes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.id);

    const [rows] = await pool.query<any[]>(
      `
      SELECT
        ew.id,
        ew.event_id,
        ew.wishes_from,
        ew.phone,
        ew.wishes,
        ew.media,
        ew.duration,
        ew.wishes_type,
        ew.status,
        ew.created_at,

        e.event_key,
        e.invite_key,
        e.event_type,

        JSON_UNQUOTE(JSON_EXTRACT(e.data_json,'$.banner.groom.name')) AS groom_name,
        JSON_UNQUOTE(JSON_EXTRACT(e.data_json,'$.banner.bride.name')) AS bride_name

      FROM event_wishes ew

      INNER JOIN events e
        ON ew.event_id = e.id

      WHERE e.owner_id = ?

      ORDER BY ew.created_at DESC
      `,
      [ownerId],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load wishes",
    });
  }
}
