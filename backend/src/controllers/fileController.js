const fileService = require("../services/fileService");
const AppError = require("../utils/AppError");

const sanitizeFileRecord = (file) => {
  const { publicId, ...rest } = file;
  void publicId;
  return rest;
};

const parseMetadata = (metadata) => {
  if (metadata === undefined || metadata === null || metadata === "") {
    return undefined;
  }

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed === null || (typeof parsed !== "object" && !Array.isArray(parsed))) {
        throw new AppError(400, "Metadata must be a JSON object or array");
      }
      return parsed;
    } catch {
      throw new AppError(400, "Metadata must be valid JSON");
    }
  }

  if (typeof metadata === "object") {
    return metadata;
  }

  throw new AppError(400, "Metadata must be a JSON object or array");
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, "File is required");
    }

    const metadata = parseMetadata(req.body.metadata);
    const file = await fileService.createFile(req.user.id, req.file, {
      category: req.body.category,
      folder: req.body.folder,
      referenceId: req.body.referenceId,
      metadata,
      visibility: req.body.visibility,
    });

    return res.status(201).json({ success: true, message: "File uploaded successfully", file: sanitizeFileRecord(file) });
  } catch (error) {
    return next(error);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const result = await fileService.listFilesForUser(req.user.id, req.query);
    const sanitizedItems = result.items.map(sanitizeFileRecord);
    return res.status(200).json({ success: true, ...result, items: sanitizedItems });
  } catch (error) {
    return next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const file = await fileService.getFile(req.user.id, req.params.id);
    return res.status(200).json({ success: true, file: sanitizeFileRecord(file) });
  } catch (error) {
    return next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const result = await fileService.downloadFile(req.user?.id || null, req.params.id);
    if (result.url) {
      return res.redirect(result.url);
    }

    res.setHeader("Content-Type", result.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(result.fileName || "download")}"`);
    return res.sendFile(result.path);
  } catch (error) {
    return next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteFile(req.user.id, req.params.id);
    return res.status(200).json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadFile,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
};
