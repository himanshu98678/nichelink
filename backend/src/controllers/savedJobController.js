const savedJobService = require("../services/savedJobService");

const save = async (req, res, next) => {
  try {
    const saved = await savedJobService.saveJob(req.user.id, req.params.id);
    res.status(201).json({ success: true, saved });
  } catch (error) {
    next(error);
  }
};

const unsave = async (req, res, next) => {
  try {
    await savedJobService.removeSavedJob(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Job unsaved successfully" });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await savedJobService.listSavedJobs(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  save,
  unsave,
  list,
};
