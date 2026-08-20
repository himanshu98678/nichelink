const client = require("prom-client");

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMilliseconds = new client.Histogram({
  name: "http_request_duration_milliseconds",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000],
});

register.registerMetric(httpRequestDurationMilliseconds);

const getMetrics = async () => register.metrics();

module.exports = {
  client,
  register,
  httpRequestDurationMilliseconds,
  getMetrics,
};
