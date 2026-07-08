
import { Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import { ResultSetHeader, RowDataPacket } from "mysql2";

/* ---------------------------------
   GET ALL ACCOUNTS (ADMIN)
---------------------------------- */
export async function getAccounts(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, full_name, email, phone, role, account_status, created_date
     FROM accounts`
  );
  res.json(rows);
}

/* ---------------------------------
   CREATE ACCOUNT
---------------------------------- */
export async function createAccount(req: Request, res: Response) {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO accounts
      (full_name, email, password, phone, role, account_status)
      VALUES (?, ?, ?, ?, 'guest', 'new')
      `,
      [full_name, email, passwordHash, phone ?? null]
    );

    res.status(201).json({
      id: result.insertId,
      full_name,
      email,
      phone,
      role: "guest",
      account_status: "new",
    });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email or phone already exists" });
    }
    res.status(500).json({ error: "Failed to create account" });
  }
}
/* ---------------------------------
   CHECK EMAIL / PHONE EXISTS
---------------------------------- */
export async function checkAccountExists(req: Request, res: Response) {
  const { email, phone } = req.query;

  if (!email && !phone) {
    return res.status(400).json({ exists: false });
  }

  const conditions: string[] = [];
  const values: any[] = [];

  if (email) {
    conditions.push("email = ?");
    values.push(email);
  }

  if (phone) {
    conditions.push("phone = ?");
    values.push(phone);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id
    FROM accounts
    WHERE ${conditions.join(" OR ")}
    LIMIT 1
    `,
    values
  );

  res.json({ exists: rows.length > 0 });
}
