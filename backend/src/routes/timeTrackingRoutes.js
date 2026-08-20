const express = require("express");
const authenticate = require("../middlewares/auth");
const controller = require("../controllers/timeTrackingController");

const router = express.Router();
router.use(authenticate);
router.get("/timer", controller.getActive);
router.post("/timer/start", controller.start);
router.post("/timer/pause", controller.pause);
router.post("/timer/resume", controller.resume);
router.post("/timer/stop", controller.stop);
router.post("/entries", controller.create);
router.get("/entries", controller.list);
router.put("/entries/:entryId", controller.update);
router.delete("/entries/:entryId", controller.remove);

module.exports = router;