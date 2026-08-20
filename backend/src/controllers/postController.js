const postService = require("../services/postService");

const create = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Post created successfully", post });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { communityId, authorId } = req.query;
    const result = await postService.listPosts(req.user?.id || null, { page, limit, communityId, authorId });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listSaved = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await postService.listSavedPosts(req.user.id, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const post = await postService.getPostAccessible(req.user.id, req.params.id);
    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await postService.deletePost(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const like = async (req, res, next) => {
  try {
    const result = await postService.toggleLike(req.user.id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const removeLike = async (req, res, next) => {
  try {
    const result = await postService.removeLike(req.user.id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const save = async (req, res, next) => {
  try {
    const result = await postService.toggleSave(req.user.id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const removeSave = async (req, res, next) => {
  try {
    const result = await postService.removeSave(req.user.id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const share = async (req, res, next) => {
  try {
    const share = await postService.sharePost(req.user.id, req.params.id, req.body.message);
    res.status(201).json({ success: true, message: "Post shared successfully", share });
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
  like,
  removeLike,
  save,
  removeSave,
  share,
  listSaved,
};
