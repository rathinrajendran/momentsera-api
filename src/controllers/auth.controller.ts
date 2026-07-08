import { Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET!;

  const [[user]] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, full_name, email, password, role, account_status
    FROM accounts
    WHERE email = ? AND account_status != 'deleted'
    `,
    [email]
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1h", // ⏱️ dummy (change later)
    }
  );

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      account_status: user.account_status,
    },
  });
}
