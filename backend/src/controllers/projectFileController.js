const {
  createProjectFile,
  listProjectFiles,
  getProjectFile,
  deleteProjectFile,
} = require("../services/projectFileService");
const AppError = require("../utils/AppError");

const uploadProjectFile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, "File is required");
    }

    const projectFile = await createProjectFile(req.user.id, req.params.projectId, file);
    res.status(201).json({ success: true, message: "Project file uploaded successfully", projectFile });
  } catch (error) {
    next(error);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const files = await listProjectFiles(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, files });
  } catch (error) {
    next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const file = await getProjectFile(req.user.id, req.params.projectId, req.params.fileId);
    res.status(200).json({ success: true, file });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    await deleteProjectFile(req.user.id, req.params.projectId, req.params.fileId);
    res.status(200).json({ success: true, message: "Project file deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProjectFile,
  listFiles,
  getFile,
  deleteFile,
};
