const service = require("../services/communityChatService");

const wrap = (handler) => async (req, res, next) => {
  try { return await handler(req, res); } catch (error) { return next(error); }
};

const listChannels = wrap(async (req, res) => res.json({ success: true, ...(await service.listChannels(req.user.id, req.params.communityId)) }));
const join = wrap(async (req, res) => res.status(201).json({ success: true, ...(await service.joinChannel(req.user.id, req.params.channelId)) }));
const leave = wrap(async (req, res) => { await service.leaveChannel(req.user.id, req.params.channelId); return res.json({ success: true }); });
const listMessages = wrap(async (req, res) => res.json({ success: true, ...(await service.listMessages(req.user.id, req.params.channelId, req.query)) }));
const sendMessage = wrap(async (req, res) => res.status(201).json({ success: true, message: await service.sendMessage(req.user.id, req.params.channelId, req.body) }));
const editMessage = wrap(async (req, res) => res.json({ success: true, message: await service.editMessage(req.user.id, req.params.channelId, req.params.messageId, req.body.content) }));
const deleteMessage = wrap(async (req, res) => { await service.deleteMessage(req.user.id, req.params.channelId, req.params.messageId); return res.json({ success: true }); });

module.exports = { listChannels, join, leave, listMessages, sendMessage, editMessage, deleteMessage };