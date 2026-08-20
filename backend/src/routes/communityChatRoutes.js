const express = require("express");
const authenticate = require("../middlewares/auth");
const controller = require("../controllers/communityChatController");

const router = express.Router();
router.use(authenticate);
router.get("/communities/:communityId/channels", controller.listChannels);
router.post("/channels/:channelId/join", controller.join);
router.delete("/channels/:channelId/leave", controller.leave);
router.get("/channels/:channelId/messages", controller.listMessages);
router.post("/channels/:channelId/messages", controller.sendMessage);
router.patch("/channels/:channelId/messages/:messageId", controller.editMessage);
router.delete("/channels/:channelId/messages/:messageId", controller.deleteMessage);

module.exports = router;