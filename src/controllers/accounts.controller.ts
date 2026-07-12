
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
     return res.status(400).json({
       success: false,
       message: "Full name, email and password are required.",
     });
   }

   try {
     // Check existing email
     const [existing] = await pool.query<RowDataPacket[]>(
       `
      SELECT id
      FROM accounts
      WHERE email = ?
      LIMIT 1
      `,
       [email.trim().toLowerCase()],
     );

     if (existing.length) {
       return res.status(409).json({
         success: false,
         message: "Email already exists.",
       });
     }

     const passwordHash = await bcrypt.hash(password, 12);

     const [result] = await pool.query<ResultSetHeader>(
       `
      INSERT INTO accounts (
        full_name,
        email,
        password_hash,
        phone
      )
      VALUES (?, ?, ?, ?)
      `,
       [
         full_name.trim(),
         email.trim().toLowerCase(),
         passwordHash,
         phone ?? null,
       ],
     );

     return res.status(201).json({
       success: true,
       message: "Account created successfully.",
       data: {
         id: result.insertId,
         full_name,
         email,
       },
     });
   } catch (err: any) {
     console.error(err);

     return res.status(500).json({
       success: false,
       message: err.message,
     });
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
