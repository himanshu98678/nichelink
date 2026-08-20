const messageService = require("../services/messageService");
const prisma = require("../lib/prisma");

const send = async (req, res, next) => {
  try {
    const message = await messageService.sendMessage(req.user.id, req.body);
    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const message = await messageService.editMessage(req.user.id, req.params.id, req.body.content);
    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const isHard = req.query.hard === "true";
    await messageService.deleteMessage(req.user.id, req.params.id, { hard: isHard });
    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    let conversationId = req.params.id;
    // Check if the id belongs to a message so we can mark its conversation read
    const msg = await prisma.message
      .findUnique({
        where: { id: conversationId },
        select: { conversationId: true },
      })
      .catch(() => null);

    if (msg) {
      conversationId = msg.conversationId;
    }

    const result = await messageService.markSeen(req.user.id, conversationId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await messageService.searchMessages(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listByConversation = async (req, res, next) => {
  try {
    const result = await messageService.listMessages(req.user.id, req.params.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  send,
  edit,
  remove,
  markRead,
  search,
  listByConversation,
};
