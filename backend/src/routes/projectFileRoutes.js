const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  uploadProjectFile,
  listFiles,
  getFile,
  deleteFile,
} = require("../controllers/projectFileController");
const { upload } = require("../controllers/uploadController");
const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const { uploadLimiter } = require("../middlewares/rateLimiter");
const { projectFileIdParamValidationRules } = require("../validators/projectValidators");

router.post("/:projectId/files", authenticate, uploadLimiter, upload.single("file"), uploadProjectFile);
router.get("/:projectId/files", authenticate, listFiles);
router.get(
  "/:projectId/files/:fileId",
  authenticate,
  ...projectFileIdParamValidationRules,
  validateRequest,
  getFile,
);
router.delete(
  "/:projectId/files/:fileId",
  authenticate,
  ...projectFileIdParamValidationRules,
  validateRequest,
  deleteFile,
);

module.exports = router;
