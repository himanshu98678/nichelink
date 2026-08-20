const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const { APP_URL, UPLOAD_MAX_FILE_SIZE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("../config/env");

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

const PUBLIC_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "public");
const PRIVATE_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "private");
const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];
const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-7z-compressed",
];
const ALLOWED_GENERAL_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
];
const EXTENSION_WHITELIST = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".zip": "application/zip",
  ".7z": "application/x-7z-compressed",
};
const DISALLOWED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".js",
  ".ps1",
  ".dll",
  ".com",
  ".scr",
  ".msi",
  ".vbs",
];
const MAX_FILE_SIZE = Number(UPLOAD_MAX_FILE_SIZE) || 50 * 1024 * 1024;

function normalizeFolder(folder) {
  if (!folder) {
    return "files";
  }

  const sanitized = String(folder).trim().replace(/[\\/\\]+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "_");
  return sanitized.length > 0 ? sanitized : "files";
}

function normalizeVisibility(visibility) {
  if (!visibility) {
    return "PUBLIC";
  }

  const normalized = String(visibility).trim().toUpperCase();
  return normalized === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

function getExtension(fileName) {
  return path.extname(String(fileName).trim()).toLowerCase();
}

function sanitizeFileName(fileName) {
  const base = path.basename(String(fileName).trim());
  const sanitized = base
    .replace(/[\\\\/:*?"<>|\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  if (!sanitized) {
    return `file-${crypto.randomBytes(8).toString("hex")}`;
  }
  return sanitized.slice(0, 200);
}

function getAllowedMimeTypes(folder) {
  const normalized = String(folder || "").toLowerCase();
  if (normalized.includes("avatar") || normalized.includes("cover") || normalized.includes("image") || normalized.includes("banner") || normalized.includes("post")) {
    return ALLOWED_IMAGE_MIME_TYPES;
  }
  if (normalized.includes("video")) {
    return ALLOWED_VIDEO_MIME_TYPES;
  }
  if (normalized.includes("document") || normalized.includes("doc") || normalized.includes("pdf") || normalized.includes("spreadsheet") || normalized.includes("xls")) {
    return ALLOWED_DOCUMENT_MIME_TYPES;
  }
  return ALLOWED_GENERAL_MIME_TYPES;
}

function getAllowedExtensions(folder) {
  const normalized = String(folder || "").toLowerCase();
  if (normalized.includes("avatar") || normalized.includes("cover") || normalized.includes("image") || normalized.includes("banner") || normalized.includes("post")) {
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  }
  if (normalized.includes("video")) {
    return [".mp4", ".webm"];
  }

  if (normalized.includes("document") || normalized.includes("doc") || normalized.includes("pdf") || normalized.includes("spreadsheet") || normalized.includes("xls")) {
    return [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip", ".7z"];
  }

  return Object.keys(EXTENSION_WHITELIST);
}

function validateFileUpload(file, folder) {
  if (!file || !file.originalname || !file.mimetype) {
    throw new AppError(400, "File is required");
  }

  if (String(file.originalname).includes("../") || String(file.originalname).includes("..\\") || String(file.originalname).includes("/") || String(file.originalname).includes("\\")) {
    throw new AppError(400, "Invalid file name");
  }

  const fileSize = Number(file.size || (file.buffer ? file.buffer.length : 0));
  if (file.buffer && fileSize <= 0) {
    throw new AppError(400, "File must not be empty");
  }

  if (file.buffer && fileSize > MAX_FILE_SIZE) {
    throw new AppError(413, "File exceeds the maximum allowed size");
  }

  const ext = getExtension(file.originalname);
  if (!ext || DISALLOWED_EXTENSIONS.includes(ext)) {
    throw new AppError(400, "Unsupported file extension");
  }

  const allowedExtensions = getAllowedExtensions(folder);
  if (!allowedExtensions.includes(ext)) {
    throw new AppError(400, `Unsupported file extension: ${ext}`);
  }

  const allowedMimeTypes = getAllowedMimeTypes(folder);
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(400, `Unsupported file type: ${file.mimetype}`);
  }

  const expectedMime = EXTENSION_WHITELIST[ext];
  if (expectedMime && expectedMime !== file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(400, "File type does not match file extension");
  }
}

function ensurePathInsideBase(filePath, baseDir) {
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new AppError(400, "Invalid file path");
  }
  return resolved;
}

function buildLocalUrl(folder, fileName) {
  const baseUrl = String(APP_URL || "http://localhost:5000").replace(/\/+$|\s+$/g, "");
  const prefix = folder ? `${folder.replace(/\\/g, "/")}/` : "";
  return `${baseUrl}/uploads/${prefix}${fileName}`;
}

function getLocalFilePath(publicId) {
  if (!publicId) {
    throw new AppError(400, "Invalid local file identifier");
  }

  const uploadRoot = path.join(__dirname, "..", "..", "uploads");
  const filePath = path.join(uploadRoot, publicId);
  return ensurePathInsideBase(filePath, uploadRoot);
}

const uploadToStorage = async (file, folder = "nichelink", options = {}) => {
  const visibility = normalizeVisibility(options.visibility);
  if (!file || !file.originalname || !file.mimetype || !file.buffer) {
    throw new AppError(400, "File is required");
  }

  validateFileUpload(file, folder);

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    const result = await new Promise((resolve, reject) => {
      const publicId = `${normalizeFolder(folder)}/${crypto.randomBytes(12).toString("hex")}`;
      const stream = cloudinary.uploader.upload_stream({
        folder: normalizeFolder(folder),
        public_id: publicId,
        resource_type: "auto",
        type: visibility === "PRIVATE" ? "authenticated" : "upload",
      }, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: "cloudinary",
      visibility,
    };
  }

  const safeFolder = normalizeFolder(folder);
  const baseDir = visibility === "PRIVATE" ? PRIVATE_UPLOAD_DIR : PUBLIC_UPLOAD_DIR;
  const targetDir = path.join(baseDir, safeFolder);
  fs.mkdirSync(targetDir, { recursive: true });

  const secureName = sanitizeFileName(file.originalname);
  const fileName = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}-${secureName}`;
  const filePath = path.join(targetDir, fileName);
  ensurePathInsideBase(filePath, baseDir);

  try {
    fs.writeFileSync(filePath, file.buffer);
  } catch {
    throw new AppError(500, "Failed to save uploaded file");
  }

  const publicId = path.relative(path.join(__dirname, "..", "..", "uploads"), filePath).replace(/\\/g, "/");
  const url = visibility === "PUBLIC" ? buildLocalUrl(safeFolder, fileName) : null;

  return {
    url,
    publicId,
    provider: "local",
  };
};

const deleteFromStorage = async (publicId, provider = "local") => {
  if (!publicId) {
    return;
  }

  if (provider === "cloudinary") {
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: "auto" }, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
    }).catch(() => null);
    return;
  }

  const uploadRoot = path.join(__dirname, "..", "..", "uploads");
  const filePath = path.join(uploadRoot, publicId);
  if (!fs.existsSync(filePath)) {
    return;
  }

  try {
    fs.unlinkSync(ensurePathInsideBase(filePath, uploadRoot));
  } catch {
    // ignore deletion issues for local files.
  }
};

const getCloudinaryDeliveryUrl = (publicId, fileType, visibility = "PRIVATE") => {
  if (!publicId) {
    throw new AppError(404, "File delivery is unavailable");
  }

  const resourceType = String(fileType || "").startsWith("image/") ? "image" : "raw";
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: visibility === "PRIVATE",
    type: visibility === "PRIVATE" ? "authenticated" : "upload",
    resource_type: resourceType,
  });
};

module.exports = {
  uploadToStorage,
  deleteFromStorage,
  getLocalFilePath,
  validateFileUpload,
  getCloudinaryDeliveryUrl,
  sanitizeFileName,
  MAX_FILE_SIZE,
};
