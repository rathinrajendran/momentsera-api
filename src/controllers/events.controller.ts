import { Request, Response } from "express";
import pool from "../db";
import { deepMerge } from "../utils/deepMerge";
import { setByPath } from "../utils/setByPath";

/* =========================================================
   HELPERS
========================================================= */

/** Convert string to URL-safe slug */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Check if event_key already exists */
async function isEventKeyAvailable(key: string): Promise<boolean> {
  const [[row]] = await pool.query<any[]>(
    `
    SELECT id
    FROM events
    WHERE event_key = ?
    LIMIT 1
    `,
    [key],
  );

  return !row;
}

/** Try semantic candidates in order */
async function generateSemanticEventKey(candidates: string[]): Promise<string> {
  for (const key of candidates) {
    if (await isEventKeyAvailable(key)) {
      return key;
    }
  }

  // Absolute fallback (extremely rare)
  return `${candidates[0]}-${Date.now()}`;
}

/* =========================================================
   CREATE / UPSERT DRAFT (ONBOARDING)
========================================================= */

export async function upsertOnboardingEvent(req: Request, res: Response) {
  const owner_id = req.user!.id;

  const { invite_key, event_type, stage, data = {} } = req.body;

  if (!invite_key || !event_type || !stage) {
    return res.status(400).json({
      error: "invite_key, event_type and stage are required",
    });
  }

  /* ---------- CHECK EXISTING DRAFT ---------- */

  const [[existing]] = await pool.query<any[]>(
    `
    SELECT id, event_key, data_json
    FROM events
    WHERE owner_id = ?
      AND invite_key = ?
      AND status = 'draft'
    LIMIT 1
    `,
    [owner_id, invite_key],
  );

  /* ---------- UPDATE EXISTING DRAFT ---------- */

  if (existing) {
    const merged = deepMerge(JSON.parse(existing.data_json || "{}"), data);

    await pool.query(
      `
      UPDATE events
      SET
        data_json = ?,
        stage = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [JSON.stringify(merged), stage, existing.id],
    );

    return res.json({
      id: existing.id,
      event_key: existing.event_key,
      stage,
    });
  }

  /* ---------- CREATE NEW DRAFT ---------- */

  const year = new Date().getFullYear();
  let candidates: string[] = [];

  if (event_type === "wedding") {
    const bride = data?.announcement?.bride?.name;
    const groom = data?.announcement?.groom?.name;

    if (!bride || !groom) {
      return res.status(400).json({
        error: "Bride and Groom names are required",
      });
    }

    const brideSlug = slugify(bride);
    const groomSlug = slugify(groom);

    candidates = [
      `${brideSlug}-and-${groomSlug}`,
      `${brideSlug}-with-${groomSlug}`,
      `${brideSlug}-and-${groomSlug}-${year}`,
      `${brideSlug}-with-${groomSlug}-${year}`,
      `${brideSlug}-${groomSlug}-wedding-${year}`,
    ];
  } else if (event_type === "birthday") {
    const person =
      data?.announcement?.person?.name || data?.announcement?.birthdayPerson;

    if (!person) {
      return res.status(400).json({
        error: "Birthday person name is required",
      });
    }

    const nameSlug = slugify(person);

    candidates = [
      nameSlug,
      `${nameSlug}-birthday`,
      `${nameSlug}-${year}`,
      `birthday-${nameSlug}-${year}`,
    ];
  } else {
    candidates = [`${event_type}-${year}`, `${event_type}-${Date.now()}`];
  }

  const event_key = await generateSemanticEventKey(candidates);

  const [result] = await pool.query<any>(
    `
    INSERT INTO events (
      event_key,
      owner_id,
      event_type,
      status,
      invite_key,
      stage,
      data_json,
      expires_at
    )
    VALUES (?, ?, ?, 'draft', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
    [event_key, owner_id, event_type, invite_key, stage, JSON.stringify(data)],
  );

  res.json({
    id: result.insertId,
    event_key,
    stage,
  });
}

/* =========================================================
   SAVE ANY SECTION
========================================================= */

export async function saveEventSection(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const eventId = Number(req.params.eventId);

  const { path, data, stage } = req.body;

  if (!eventId || !path || !data) {
    return res.status(400).json({
      error: "eventId, path and data are required",
    });
  }

  const [[event]] = await pool.query<any[]>(
    `
    SELECT data_json
    FROM events
    WHERE id = ? AND owner_id = ?
    `,
    [eventId, owner_id],
  );

  if (!event) {
    return res.status(404).json({
      error: "Event not found",
    });
  }

  const current = JSON.parse(event.data_json || "{}");

  const merged = deepMerge(current, setByPath({}, path, data));

  await pool.query(
    `
    UPDATE events
    SET
      data_json = ?,
      stage = COALESCE(?, stage),
      updated_at = NOW()
    WHERE id = ?
    `,
    [JSON.stringify(merged), stage ?? null, eventId],
  );

  res.json({
    success: true,
    stage: stage ?? null,
  });
}

/* =========================================================
   PUBLISH EVENT
========================================================= */

export async function publishEvent(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const eventId = Number(req.params.eventId);

  const [[event]] = await pool.query<any[]>(
    `
    SELECT data_json
    FROM events
    WHERE id = ? AND owner_id = ?
    `,
    [eventId, owner_id],
  );

  if (!event) {
    return res.status(404).json({
      error: "Event not found",
    });
  }

  const data = JSON.parse(event.data_json || "{}");

  if (!data.announcement) {
    return res.status(400).json({
      error: "Announcement missing",
    });
  }

  await pool.query(
    `
    UPDATE events
    SET
      stage = 'published',
      status = 'published',
      updated_at = NOW()
    WHERE id = ?
    `,
    [eventId],
  );

  res.json({ success: true });
}

/* =========================================================
   GET EVENT BY KEY
========================================================= */

export async function getEventByKey(req: Request, res: Response) {
  const { event_key } = req.params;

  const [[row]] = await pool.query<any[]>(
    `
    SELECT
      e.*,

      ei.id                AS template_id,
      ei.invite_key        AS template_key,
      ei.invite_code,
      ei.shortname,
      ei.web_image,
      ei.mob_image,
      ei.price,
      ei.description,
      ei.main_category,
      ei.type,
      ei.style_category,
      ei.default_settings

    FROM events e
    LEFT JOIN event_invites ei
      ON ei.invite_key = e.invite_key

    WHERE e.event_key = ?
    LIMIT 1
    `,
    [event_key],
  );

  if (!row) {
    return res.status(404).json({
      error: "Event not found",
    });
  }

  const raw = JSON.parse(row.data_json || "{}");
  const defaults = row.default_settings ? JSON.parse(row.default_settings) : {};

  /**
   * Merge template defaults with user data.
   * - Objects => merged (user overrides defaults)
   * - Arrays  => user array if exists, otherwise default array
   */
  const mergeSection = (key: string) => {
    const defaultValue = defaults[key];
    const userValue = raw[key];

    if (Array.isArray(userValue)) return userValue;
    if (Array.isArray(defaultValue)) return defaultValue ?? [];

    return {
      ...(defaultValue ?? {}),
      ...(userValue ?? {}),
    };
  };

  res.json({
    invite: {
      id: row.id,
      owner_id: row.owner_id,
      event_key: row.event_key,
      invite_key: row.invite_key,
      event_type: row.event_type,
      status: row.status,
      stage: row.stage,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
    },

    // Template metadata only
    template: {
      id: row.template_id,
      invite_key: row.template_key,
      invite_code: row.invite_code,
      shortname: row.shortname,
      web_image: row.web_image,
      mob_image: row.mob_image,
      price: row.price,
      description: row.description,
      main_category: row.main_category,
      type: row.type,
      style_category: row.style_category,
    },

    announcement: mergeSection("announcement"),
    schedule: mergeSection("schedule"),
    gallery: mergeSection("gallery"),
    wishes: mergeSection("wishes"),
    theme: mergeSection("theme"),
    music: mergeSection("music"),
    motion: mergeSection("motion"),
    sharing: mergeSection("sharing"),
    privacy: mergeSection("privacy"),
    print: mergeSection("print"),
    settings: mergeSection("settings"),
    dressCode: mergeSection("dressCode"),
    timeline: mergeSection("timeline"),
    rsvp: mergeSection("rsvp"),
  });
}
/* =========================================================
   DELETE EVENT
========================================================= */

export async function deleteEvent(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const eventId = Number(req.params.eventId);

  if (!eventId) {
    return res.status(400).json({
      error: "eventId is required",
    });
  }

  const [[event]] = await pool.query<any[]>(
    `
    SELECT id
    FROM events
    WHERE id = ? AND owner_id = ?
    `,
    [eventId, owner_id],
  );

  if (!event) {
    return res.status(404).json({
      error: "Event not found",
    });
  }

  await pool.query(`DELETE FROM events WHERE id = ?`, [eventId]);

  res.json({
    success: true,
    deleted: true,
  });
}

export async function checkEventKeyAvailability(
  req: Request<{ eventKey: string }>,
  res: Response,
) {
  try {
    const eventKey = req.params.eventKey.trim();

    if (!eventKey) {
      return res.status(400).json({
        error: "eventKey is required",
      });
    }

    const available = await isEventKeyAvailable(eventKey);

    return res.json({
      available,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to check event key",
    });
  }
}

export async function updateEventKey(req: Request, res: Response) {
  const owner_id = req.user!.id;
  const eventId = Number(req.params.eventId);
  const { event_key } = req.body;

  if (!event_key?.trim()) {
    return res.status(400).json({
      error: "event_key is required",
    });
  }

  const available = await isEventKeyAvailable(event_key);

  if (!available) {
    return res.status(409).json({
      error: "URL already in use",
    });
  }

  await pool.query(
    `
    UPDATE events
    SET event_key = ?, updated_at = NOW()
    WHERE id = ? AND owner_id = ?
    `,
    [event_key, eventId, owner_id],
  );

  return res.json({
    success: true,
    event_key,
  });
}
