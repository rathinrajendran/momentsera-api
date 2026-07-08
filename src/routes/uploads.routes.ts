// routes/uploads.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/wishes");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

router.post(
  "/uploads/wishes",
  upload.single("file"),
  (req, res) => {
    res.json({
      url: `/uploads/wishes/${req.file?.filename}`,
    });
  }
);

export default router;
