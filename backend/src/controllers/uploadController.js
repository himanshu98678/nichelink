const multer = require("multer");
const { uploadToStorage, validateFileUpload, MAX_FILE_SIZE } = require("../services/uploadService");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const fileService = require("../services/fileService");

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    try {
      validateFileUpload(file, req.body?.folder || req.body?.category || "files");
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  },
});

const requireFile = (req, fieldName = "file") => {
  if (req.file) {
    return req.file;
  }

  if (req.files && req.files.length > 0) {
    return req.files[0];
  }

  if (req.files && Array.isArray(req.files) && req.files.length === 0) {
    throw new AppError(400, "No file uploaded");
  }

  throw new AppError(400, `No ${fieldName} uploaded`);
};

const uploadAvatar = async (req, res, next) => {
  try {
    const file = requireFile(req, "file");
    const result = await uploadToStorage(file, "avatars", { visibility: "PUBLIC" });
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: result.url } });
    res.status(200).json({ success: true, message: "Avatar uploaded successfully", url: result.url });
  } catch (error) {
    next(error);
  }
};

const uploadCover = async (req, res, next) => {
  try {
    const file = requireFile(req, "file");
    const result = await uploadToStorage(file, "covers", { visibility: "PUBLIC" });
    await prisma.user.update({ where: { id: req.user.id }, data: { coverImage: result.url } });
    res.status(200).json({ success: true, message: "Cover uploaded successfully", url: result.url });
  } catch (error) {
    next(error);
  }
};

const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError(400, "No files uploaded");
    }

    const uploads = await Promise.all(req.files.map((file) => uploadToStorage(file, "documents", { visibility: "PRIVATE" })));
    const urls = uploads.map((item) => item.url).filter(Boolean);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    await prisma.user.update({
      where: { id: req.user.id },
      data: { documents: [...(user.documents || []), ...urls] },
    });
    res.status(200).json({ success: true, message: "Documents uploaded successfully", urls });
  } catch (error) {
    next(error);
  }
};

const uploadMedia = async (req, res, next) => {
  try {
    const file = requireFile(req, "file");
    const category = String(req.body?.category || "POST").trim().toUpperCase();
    const folderByCategory = {
      POST: "posts",
      AVATAR: "avatars",
      COMMUNITY: "community_covers",
      PROJECT: "project_banners",
      MESSAGE: "message_attachments",
    };
    const folder = folderByCategory[category] || category.toLowerCase().replace(/\s+/g, "_");
    const result = await uploadToStorage(file, folder, { visibility: "PUBLIC" });
    const fileRecord = await fileService.createFile(req.user.id, file, {
      category,
      folder,
      visibility: "PUBLIC",
      uploadResult: result,
    });
    
    return res.status(200).json({
      success: true,
      message: "Media uploaded successfully",
      file: {
        url: result.url,
        publicId: result.publicId,
        provider: result.provider,
        id: fileRecord.id,
        category: fileRecord.category,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  upload,
  uploadAvatar,
  uploadCover,
  uploadDocuments,
  uploadMedia,
};
