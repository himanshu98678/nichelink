const commentService = require("../services/commentService");

const create = async (req, res, next) => {
  try {
    const comment = await commentService.createComment(req.user.id, req.params.id, req.body);
    res.status(201).json({ success: true, message: "Comment created successfully", comment });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const comments = await commentService.listComments(req.user.id, req.params.id);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Comment updated successfully", comment });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await commentService.deleteComment(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const reply = async (req, res, next) => {
  try {
    const reply = await commentService.replyComment(req.user.id, req.params.id, req.body);
    res.status(201).json({ success: true, message: "Reply created successfully", reply });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, list, update, remove, reply };