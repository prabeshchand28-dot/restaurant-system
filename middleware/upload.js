// middleware/upload.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function makeUpload(folder) {
  const dest = path.join(__dirname, `../uploads/${folder}`);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename:    (req, file, cb) => cb(null, `${folder}-${Date.now()}${path.extname(file.originalname)}`)
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = { makeUpload };