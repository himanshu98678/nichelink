const jobService = require("../services/jobService");

const create = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.user.id, req.params.id, req.body, req.user.role);
    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await jobService.deleteJob(req.user.id, req.params.id, req.user.role);
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params.id);
    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await jobService.listJobs(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  update,
  remove,
  getOne,
  list,
};
