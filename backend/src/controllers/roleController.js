const { assignRoleToUser, getUserRoles } = require("../services/roleService");
const { buildUserResponse } = require("../models/user");

const assignRole = async (req, res, next) => {
  try {
    const user = await assignRoleToUser(req.body.userId, req.body.role, req.user.id);
    res.status(200).json({ success: true, message: "User role updated successfully", user: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

const fetchUserRoles = async (req, res, next) => {
  try {
    const user = await getUserRoles(req.params.userId);
    res.status(200).json({ success: true, user: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignRole,
  fetchUserRoles,
};
