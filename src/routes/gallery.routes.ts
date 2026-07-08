import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

/* ---------- STORAGE ---------- */

const uploadDir = path.join(process.cwd(), "uploads/gallery");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

/* ---------- ROUTE ---------- */

router.post("/upload", authMiddleware, upload.single("image"), (req, res) => {
  const userId = req.user?.id; // ✅ typed
  const role = req.user?.role; // ✅ typed

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    filename: `/uploads/gallery/${req.file.filename}`,
  });
});



export default router;
