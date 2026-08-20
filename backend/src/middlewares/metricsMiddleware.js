const responseTime = require("response-time");
const { httpRequestDurationMilliseconds } = require("../utils/metrics");

module.exports = responseTime((req, res, time) => {
  if (!time) {
    return;
  }

  const route = req.route?.path || req.originalUrl || req.url;
  httpRequestDurationMilliseconds.observe({
    method: req.method,
    route,
    status_code: res.statusCode,
  }, time);
});
