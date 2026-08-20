const { logger } = require("../utils/logger");

module.exports = () => {
  logger.warn("Prisma config initialized; removed MongoDB connector");
  return null;
};