const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { ensureProjectAccess } = require("./projectService");
const { uploadToStorage, deleteFromStorage, sanitizeFileName } = require("./uploadService");

const createProjectFile = async (userId, projectId, file) => {
  if (!file) {
    throw new AppError(400, "File is required");
  }

  await ensureProjectAccess(userId, projectId);

  const uploadResult = await uploadToStorage(file, `project_files/${projectId}`);

  return prisma.projectFile.create({
    data: {
      projectId,
      uploadedBy: userId,
      url: uploadResult.url,
      publicId: uploadResult.publicId || null,
      provider: uploadResult.provider || "local",
      fileName: sanitizeFileName(file.originalname),
      fileType: file.mimetype,
    },
  });
};

const listProjectFiles = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
};

const getProjectFile = async (userId, projectId, fileId) => {
  await ensureProjectAccess(userId, projectId);

  const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
  if (!file || file.projectId !== projectId) {
    throw new AppError(404, "Project file not found");
  }

  return file;
};

const deleteProjectFile = async (userId, projectId, fileId) => {
  await ensureProjectAccess(userId, projectId);

  const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
  if (!file || file.projectId !== projectId) {
    throw new AppError(404, "Project file not found");
  }

  await prisma.projectFile.delete({ where: { id: fileId } });
  await deleteFromStorage(file.publicId, file.provider);
  return true;
};

module.exports = {
  createProjectFile,
  listProjectFiles,
  getProjectFile,
  deleteProjectFile,
};
