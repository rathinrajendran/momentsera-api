import pool from "../db";
import { RowDataPacket } from "mysql2";

function parseJSON(value: any) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value; // already object (MySQL JSON)
}

export async function getEventByKey(eventKey: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      e.*,
      es.invite_mode,
      es.accent_color,
      es.font_style,
      es.music,
      et.lang,
      et.data AS translation_data
    FROM events e
    LEFT JOIN event_settings es 
      ON e.id = es.event_id
    LEFT JOIN event_translations et 
      ON e.id = et.event_id 
     AND et.lang = e.default_lang
    WHERE e.event_key = ?
    `,
    [eventKey]
  );

  if (rows.length === 0) return null;

  const row = rows[0];

  const dataJson = parseJSON(row.data_json);

  return {
    event: {
      id: row.id,
      event_key: row.event_key,
      event_type: row.event_type,
      stage: row.stage,
      status: row.status,
      data_json: dataJson, // ✅ wishes preserved
    },
    settings: {
      invite_mode: row.invite_mode || "standard",
      accent_color: row.accent_color || "#000000",
      font_style: row.font_style || "serif",
      music: row.music || null,
    },
    translation: parseJSON(row.translation_data),
  };
}

export async function getEventById(eventId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      e.*,
      es.invite_mode,
      es.accent_color,
      es.font_style,
      es.music,
      et.lang,
      et.data AS translation_data
    FROM events e
    LEFT JOIN event_settings es 
      ON e.id = es.event_id
    LEFT JOIN event_translations et 
      ON e.id = et.event_id 
     AND et.lang = e.default_lang
    WHERE e.id = ?
    `,
    [eventId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];

  const dataJson = parseJSON(row.data_json);

  return {
    event: {
      id: row.id,
      event_key: row.event_key,
      event_type: row.event_type,
      stage: row.stage,
      status: row.status,
      data_json: dataJson, // ✅ wishes preserved
    },
    design: {
      invite_mode: row.invite_mode || "standard",
      accent_color: row.accent_color || "#000000",
      font_style: row.font_style || "serif",
      music: row.music || null,
    },
    translation: parseJSON(row.translation_data),
  };
}
