const { getDashboardAnalytics } = require("../services/dashboardAnalyticsService");

const get = async (req, res, next) => {
  try {
    const period = ["week", "month", "year"].includes(req.query.period) ? req.query.period : "month";
    res.status(200).json({ success: true, analytics: await getDashboardAnalytics(req.user.id, period) });
  } catch (error) {
    next(error);
  }
};

module.exports = { get };