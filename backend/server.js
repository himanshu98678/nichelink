require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/socket");
const emailService = require("./src/services/emailService");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const startServer = async () => {
  try {
    await emailService.verifyTransport();
  } catch (error) {
    console.error("Startup SMTP verification failed; server will continue, but OTP delivery can still fail at runtime.");
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();