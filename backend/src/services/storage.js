/**
 * storage service — abstraction over file persistence.
 * Current implementation: local disk under UPLOAD_DIR. Swap with an S3-compatible
 * implementation later by matching this same { save, getPath } contract.
 */
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getUploadDir() {
  return UPLOAD_DIR;
}

function getPath(fileName) {
  return path.join(UPLOAD_DIR, fileName);
}

module.exports = { getUploadDir, getPath };
