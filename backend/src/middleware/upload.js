const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { getUploadDir } = require("../services/storage");

const ALLOWED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error("Unsupported file type. Allowed: PDF, PNG, JPG, WEBP"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = upload;
