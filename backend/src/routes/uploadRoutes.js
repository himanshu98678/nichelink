const express = require("express");
const router = express.Router();

const { upload, uploadAvatar, uploadCover, uploadDocuments, uploadMedia } = require("../controllers/uploadController");
const fileController = require("../controllers/fileController");
const authenticate = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const validateRequest = require("../middlewares/validateRequest");
const { uploadLimiter } = require("../middlewares/rateLimiter");
const { uploadFileValidationRules, listFilesValidationRules, fileIdParamRules } = require("../validators/uploadValidators");

// Generic media upload (for posts, comments, etc.)
router.post("/", authenticate, uploadLimiter, upload.single("file"), uploadMedia);

router.post("/avatar", authenticate, uploadLimiter, upload.single("file"), uploadAvatar);
router.post("/cover", authenticate, uploadLimiter, upload.single("file"), uploadCover);
router.post("/documents", authenticate, uploadLimiter, upload.array("files", 5), uploadDocuments);

router.post(
  "/files",
  authenticate,
  uploadLimiter,
  upload.single("file"),
  uploadFileValidationRules,
  validateRequest,
  fileController.uploadFile
);
router.get("/files", authenticate, listFilesValidationRules, validateRequest, fileController.listFiles);
router.get("/files/:id", authenticate, fileIdParamRules, validateRequest, fileController.getFile);
router.get("/files/:id/download", optionalAuth, fileIdParamRules, validateRequest, fileController.downloadFile);
router.delete("/files/:id", authenticate, fileIdParamRules, validateRequest, fileController.deleteFile);

module.exports = router;
