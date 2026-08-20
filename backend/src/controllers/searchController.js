const searchService = require("../services/searchService");

const search = async (req, res, next) => {
  try {
    const result = await searchService.search(req.user, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const suggestions = async (req, res, next) => {
  try {
    const result = await searchService.getSuggestions(req.user, req.query.q);
    res.status(200).json({ success: true, suggestions: result });
  } catch (error) {
    next(error);
  }
};

const recentSearches = async (req, res, next) => {
  try {
    const result = await searchService.getRecentSearches(req.user.id);
    res.status(200).json({ success: true, recent: result });
  } catch (error) {
    next(error);
  }
};

const clearRecentSearches = async (req, res, next) => {
  try {
    await searchService.clearRecentSearches(req.user.id);
    res.status(200).json({ success: true, message: "Recent searches cleared" });
  } catch (error) {
    next(error);
  }
};

const trending = async (req, res, next) => {
  try {
    const result = await searchService.getTrending(req.query.limit);
    res.status(200).json({ success: true, trending: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
  suggestions,
  recentSearches,
  clearRecentSearches,
  trending,
};
