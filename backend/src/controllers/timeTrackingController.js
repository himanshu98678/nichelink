const service = require("../services/timeTrackingService");

const wrap = (handler) => async (req, res, next) => {
  try { return await handler(req, res); } catch (error) { return next(error); }
};

const getActive = wrap(async (req, res) => res.json({ success: true, timer: await service.getActiveTimer(req.user.id) }));
const start = wrap(async (req, res) => res.status(201).json({ success: true, timer: await service.startTimer(req.user.id, req.body) }));
const pause = wrap(async (req, res) => res.json({ success: true, timer: await service.pauseTimer(req.user.id) }));
const resume = wrap(async (req, res) => res.json({ success: true, timer: await service.resumeTimer(req.user.id) }));
const stop = wrap(async (req, res) => res.json({ success: true, entry: await service.stopTimer(req.user.id, req.body) }));
const create = wrap(async (req, res) => res.status(201).json({ success: true, entry: await service.createTimeEntry(req.user.id, req.body) }));
const list = wrap(async (req, res) => res.json({ success: true, entries: await service.listTimeEntries(req.user.id, req.query) }));
const update = wrap(async (req, res) => res.json({ success: true, entry: await service.updateTimeEntry(req.user.id, req.params.entryId, req.body) }));
const remove = wrap(async (req, res) => { await service.deleteTimeEntry(req.user.id, req.params.entryId); return res.json({ success: true }); });

module.exports = { getActive, start, pause, resume, stop, create, list, update, remove };