const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { uploadToStorage, deleteFromStorage, sanitizeFileName } = require("./uploadService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

const normalizePagination = (options = {}) => {
  const page = Number.isNaN(Number(options.page)) ? DEFAULT_PAGE : Number(options.page);
  const limit = Number.isNaN(Number(options.limit)) ? DEFAULT_LIMIT : Number(options.limit);
  return {
    page: page < 1 ? DEFAULT_PAGE : page,
    limit: limit < 1 ? DEFAULT_LIMIT : limit,
    skip: (page - 1) * limit,
  };
};

const normalizeCategory = (category) => {
  if (!category) {return undefined;}
  return String(category).trim().toUpperCase();
};

const normalizeFolder = (folder, category) => {
  if (folder) {
    return String(folder).trim().replace(/\s+/g, "_");
  }

  if (category) {
    return String(category).trim().toLowerCase().replace(/\s+/g, "_");
  }

  return "files";
};

const createFile = async (userId, file, options = {}) => {
  if (!file) {
    throw new AppError(400, "File is required");
  }

  const category = normalizeCategory(options.category) || "GENERAL";
  const folder = normalizeFolder(options.folder, category);
  const visibility = String(options.visibility || "PUBLIC").trim().toUpperCase();
  const normalizedVisibility = visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  const uploadResult = options.uploadResult || await uploadToStorage(file, folder, { visibility: normalizedVisibility });

  return prisma.file.create({
    data: {
      userId,
      url: uploadResult.url || "",
      publicId: uploadResult.publicId || null,
      provider: uploadResult.provider || "local",
      folder,
      category,
      fileName: sanitizeFileName(file.originalname || "upload"),
      fileType: file.mimetype,
      fileSize: file.size || (file.buffer ? file.buffer.length : null),
      referenceId: options.referenceId || null,
      metadata: options.metadata || null,
      visibility: normalizedVisibility,
    },
  });
};

const listFilesForUser = async (userId, options = {}) => {
  const { category, page, limit, skip } = normalizePagination(options);
  const where = { userId };

  if (category) {
    where.category = normalizeCategory(category);
  }

  const [items, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.file.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
    hasNext: page * limit < total,
    hasPrevious: page > 1,
  };
};

const getFile = async (userId, fileId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new AppError(404, "File not found");
  }
  if (file.userId !== userId) {
    throw new AppError(403, "Access denied to file");
  }

  return file;
};

const downloadFile = async (requesterId, fileId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new AppError(404, "File not found");
  }

  const isOwner = Boolean(requesterId && file.userId === requesterId);
  const isPublicFile = file.visibility === "PUBLIC" && Boolean(file.url);

  if (!isOwner && !isPublicFile) {
    throw new AppError(403, "Access denied to file");
  }

  if (file.provider === "cloudinary") {
    const { getCloudinaryDeliveryUrl } = require("./uploadService");
    return {
      contentType: file.fileType,
      fileName: file.fileName,
      url: isPublicFile ? file.url : getCloudinaryDeliveryUrl(file.publicId, file.fileType, file.visibility),
      public: isPublicFile,
    };
  }

  const uploadRoot = path.join(__dirname, "..", "..", "uploads");
  const filePath = file.publicId ? path.join(uploadRoot, file.publicId) : path.join(uploadRoot, "public", file.folder || "files", path.basename(file.url || ""));
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(uploadRoot))) {
    throw new AppError(400, "Invalid file path");
  }
  if (!fs.existsSync(resolved)) {
    throw new AppError(404, "File not found on disk");
  }

  return {
    contentType: file.fileType,
    fileName: file.fileName,
    path: resolved,
    public: isPublicFile,
  };
};

const deleteFile = async (userId, fileId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new AppError(404, "File not found");
  }
  if (file.userId !== userId) {
    throw new AppError(403, "Access denied to file");
  }

  await deleteFromStorage(file.publicId, file.provider);
  await prisma.file.delete({ where: { id: fileId } });

  return true;
};

module.exports = {
  createFile,
  listFilesForUser,
  getFile,
  downloadFile,
  deleteFile,
};
