import { Request, Response } from "express";
import pool from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// controllers/drafts.controller.ts
export async function createDraft(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const { type, invite_key, data } = req.body;

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO drafts (owner_id, type, invite_key, data)
    VALUES (?, ?, ?, ?)
    `,
    [owner_id, type, invite_key, JSON.stringify(data)]
  );

  res.json({ draft_id: result.insertId });
}
export async function updateDraft(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const { draftId } = req.params;
  const { invite_key, data } = req.body;

  await pool.query(
    `
    UPDATE drafts
    SET invite_key = ?, data = ?
    WHERE id = ? AND owner_id = ? AND status = 'draft'
    `,
    [invite_key, JSON.stringify(data), draftId, owner_id]
  );

  res.json({ success: true });
}
export async function listDrafts(req: Request, res: Response) {
  const owner_id = req.user!.id;

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, type, invite_key, updated_at
    FROM drafts
    WHERE owner_id = ? AND status = 'draft'
    ORDER BY updated_at DESC
    `,
    [owner_id]
  );

  res.json(rows);
}

export async function createEventFromDraft(
  req: Request,
  res: Response
) {
  const owner_id = req.user!.id;
  const { draftId } = req.params;

  const [[draft]] = await pool.query<any[]>(
    `
    SELECT * FROM drafts
    WHERE id = ? AND owner_id = ? AND status = 'draft'
    `,
    [draftId, owner_id]
  );

  if (!draft) {
    return res.status(404).json({ error: "Draft not found" });
  }

  const event_key = `${draft.type}-${Date.now()}`;

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO events
    (event_key, owner_id, event_type, status, invite_key, default_lang)
    VALUES (?, ?, ?, 'draft', ?, 'en')
    `,
    [event_key, owner_id, draft.type, draft.invite_key]
  );

  const eventId = result.insertId;

  await pool.query(
    `
    INSERT INTO event_translations (event_id, lang, data)
    VALUES (?, 'en', ?)
    `,
    [eventId, JSON.stringify(draft.data.form)]
  );

  await pool.query(
    `UPDATE drafts SET status = 'converted' WHERE id = ?`,
    [draftId]
  );

  res.json({ event_key });
}
