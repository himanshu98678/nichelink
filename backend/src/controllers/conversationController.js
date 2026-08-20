const conversationService = require("../services/conversationService");

const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isGroup, targetUserId, name, memberIds } = req.body;
    let conversation;
    if (isGroup) {
      conversation = await conversationService.createGroup(userId, name, memberIds || []);
    } else {
      conversation = await conversationService.createConversation(userId, targetUserId);
    }
    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await conversationService.listConversations(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversation(req.user.id, req.params.id);
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const conversation = await conversationService.renameGroup(
      req.user.id,
      req.params.id,
      req.body.name,
      req.user.role
    );
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await conversationService.deleteGroup(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const addMembers = async (req, res, next) => {
  try {
    const conversation = await conversationService.addMembers(
      req.user.id,
      req.params.id,
      req.body.memberIds,
      req.user.role
    );
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const conversation = await conversationService.removeMember(
      req.user.id,
      req.params.id,
      req.params.userId,
      req.user.role
    );
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const leave = async (req, res, next) => {
  try {
    const conversation = await conversationService.leaveGroup(req.user.id, req.params.id);
    res.status(200).json({ success: true, conversation });
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
  addMembers,
  removeMember,
  leave,
};
