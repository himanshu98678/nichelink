const reportService = require("../services/reportService");

const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Report submitted successfully", report });
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const result = await reportService.listUserReports(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  listReports,
};
