const {
  createProject,
  listProjectsForUser,
  getProjectForUser,
  updateProject,
  archiveProject,
  restoreProject,
  removeProjectMember,
  getProjectStats,
  deleteProject,
  assignMemberToProject,
  listProjectMembers,
  updateProjectMemberRole,
  getProjectDashboard,
} = require("../services/projectService");

const create = async (req, res, next) => {
  try {
    const project = await createProject(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Project created successfully", project });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await listProjectsForUser(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await getProjectForUser(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await updateProject(req.user.id, req.params.projectId, req.body);
    res.status(200).json({ success: true, message: "Project updated successfully", project });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteProject(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const assignMember = async (req, res, next) => {
  try {
    const member = await assignMemberToProject(req.user.id, req.params.projectId, req.body.userId, req.body.role || "MEMBER");
    res.status(200).json({ success: true, message: "Member assigned successfully", member });
  } catch (error) {
    next(error);
  }
};

const archive = async (req, res, next) => {
  try {
    const project = await archiveProject(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, message: "Project archived successfully", project });
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const project = await restoreProject(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, message: "Project restored successfully", project });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await removeProjectMember(req.user.id, req.params.projectId, req.params.memberId);
    res.status(200).json({ success: true, message: "Project member removed successfully" });
  } catch (error) {
    next(error);
  }
};

const stats = async (req, res, next) => {
  try {
    const projectStats = await getProjectStats(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, stats: projectStats });
  } catch (error) {
    next(error);
  }
};

const listMembers = async (req, res, next) => {
  try {
    const members = await listProjectMembers(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const member = await updateProjectMemberRole(req.user.id, req.params.projectId, req.params.memberId, req.body.role);
    res.status(200).json({ success: true, message: "Project member role updated successfully", member });
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const dashboardData = await getProjectDashboard(req.user.id, req.params.projectId);
    res.status(200).json({ success: true, dashboard: dashboardData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  assignMember,
  archive,
  restore,
  removeMember,
  listMembers,
  updateMemberRole,
  stats,
  dashboard,
};
