const adminService = require("../services/adminService");
const { auditLogger } = require("../utils/logger");

const dashboard = async (req, res, next) => {
  try {
    const result = await adminService.getAdminDashboard();
    res.status(200).json({ success: true, dashboard: result });
  } catch (error) {
    next(error);
  }
};

const analytics = async (req, res, next) => {
  try {
    const result = await adminService.getAdminAnalytics();
    res.status(200).json({ success: true, analytics: result });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await adminService.listUsers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const listCommunities = async (req, res, next) => {
  try {
    const result = await adminService.listCommunities(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listPosts = async (req, res, next) => {
  try {
    const result = await adminService.listPosts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listComments = async (req, res, next) => {
  try {
    const result = await adminService.listComments(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listJobs = async (req, res, next) => {
  try {
    const result = await adminService.listJobs(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listProjects = async (req, res, next) => {
  try {
    const result = await adminService.listProjects(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const result = await adminService.listReports(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const result = await adminService.resolveReport(req.user.id, req.params.id, req.body.action, req.body.resolutionNotes);
    auditLogger.info({ action: "resolveReport", adminId: req.user.id, reportId: req.params.id, status: req.body.action });
    res.status(200).json({ success: true, report: result });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    auditLogger.info({ action: "deleteUser", adminId: req.user.id, targetUserId: req.params.id });
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteCommunity = async (req, res, next) => {
  try {
    await adminService.deleteCommunity(req.params.id);
    auditLogger.info({ action: "deleteCommunity", adminId: req.user.id, communityId: req.params.id });
    res.status(200).json({ success: true, message: "Community deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await adminService.deletePost(req.params.id);
    auditLogger.info({ action: "deletePost", adminId: req.user.id, postId: req.params.id });
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await adminService.deleteComment(req.params.id);
    auditLogger.info({ action: "deleteComment", adminId: req.user.id, commentId: req.params.id });
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await adminService.deleteJob(req.params.id);
    auditLogger.info({ action: "deleteJob", adminId: req.user.id, jobId: req.params.id });
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await adminService.deleteProject(req.params.id);
    auditLogger.info({ action: "deleteProject", adminId: req.user.id, projectId: req.params.id });
    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  dashboard,
  analytics,
  listUsers,
  listCommunities,
  listPosts,
  listComments,
  listJobs,
  listProjects,
  listReports,
  resolveReport,
  deleteUser,
  deleteCommunity,
  deletePost,
  deleteComment,
  deleteJob,
  deleteProject,
  getUser,
};
