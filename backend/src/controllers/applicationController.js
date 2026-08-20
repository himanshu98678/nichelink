const applicationService = require("../services/applicationService");

const apply = async (req, res, next) => {
  try {
    const application = await applicationService.applyJob(req.user.id, req.params.id, req.body);
    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    await applicationService.withdrawApplication(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Application withdrawn successfully" });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const options = { ...req.query };
    // If jobId is passed, it represents the employer view list for a specific job
    if (req.params.id) {
      options.jobId = req.params.id;
    }
    const result = await applicationService.listApplications(req.user.id, options, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationDetails(req.user.id, req.params.id, req.user.role);
    res.status(200).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const application = await applicationService.updateApplicationStatus(
      req.user.id,
      req.params.id,
      req.body.status,
      req.user.role
    );
    res.status(200).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apply,
  withdraw,
  list,
  getDetails,
  updateStatus,
};
