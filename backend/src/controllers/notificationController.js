const notificationService = require("../services/notificationService");

const list = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.countUnread(req.user.id);
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const removeAll = async (req, res, next) => {
  try {
    await notificationService.deleteAllNotifications(req.user.id);
    res.status(200).json({ success: true, message: "All notifications deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  unreadCount,
  markRead,
  markAllRead,
  remove,
  removeAll,
};
