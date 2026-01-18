import http from "http";
import { Server, Server as SocketIOServer } from "socket.io";
import app from "./app";
import logger from "./utils/logger";
import env from "./configs/variables";
// import database from "./configs/database";
import socketIO from "./utils/socket";

let server = http.createServer(app);
const startServer = async () => {
  try {
    // await database.connect();
    let io;
    if (env.DEBUG) {
      // Development: Separate socket server on different port
      const socketServer = http.createServer();
      io = new SocketIOServer(socketServer, {
        cors: {
          origin: env.FRONTEND_URL,
          // methods: ["GET", "POST"],
        },
      });
      socketServer.listen(env.SOCKET_PORT, env.BACKEND_IP, () => {
        logger.success(
          `Socket server running on http://${env.BACKEND_IP}:${env.SOCKET_PORT}`
        );
      });
    } else {
      // Production: Socket.IO on same server as Express
      io = new SocketIOServer(server, {
        cors: {
          origin: env.FRONTEND_URL,
          // methods: ["GET", "POST"],
        },
      });
    }

    global.io = io;
    socketIO(io);

    server.listen(env.PORT, env.BACKEND_IP, () => {
      logger.success(
        `API Server running on http://${env.BACKEND_IP}:${env.PORT}`
      );
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error("Unexpected Error:", error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
