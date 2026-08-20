const feedService = require("../services/feedService");

const getHomeFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.getHomeFeed(userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getLatestFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.getLatestFeed(userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getFollowingFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.getFollowingFeed(userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getCommunityFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.getCommunityFeed(req.params.communityId, userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUserFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.getUserFeed(req.params.userId, userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const searchFeed = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await feedService.searchFeed(req.query, userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomeFeed,
  getLatestFeed,
  getFollowingFeed,
  getCommunityFeed,
  getUserFeed,
  searchFeed,
};
