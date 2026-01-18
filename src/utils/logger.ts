import winston from "winston";
import path from "path";
import fs from "./fs";
import env from "../configs/variables";

const logDir = "logs";
// fs.createFolder(logDir);

const date = new Date().toISOString().slice(0, 10);
const logName = path.join(logDir, `log-${date}.log`);

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "cyan",
    success: "green",
    debug: "magenta",
  },
};

winston.addColors(customLevels.colors);

const formatMeta = winston.format((info) => {
  if (info.meta && typeof info.meta === "object") {
    info.message += ` | meta=${JSON.stringify(info.meta)}`;
  }
  if (info.error instanceof Error) {
    info.message += ` | error=${info.error.stack}`;
  }
  return info;
});

// Custom layout
const logFormat = winston.format.printf(
  ({ timestamp, level, message }) =>
    `${timestamp} [${level.toUpperCase()}] ${message}`
);

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: env.DEBUG ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    formatMeta(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
        winston.format.colorize({ all: true })
      ),
    }),
    new winston.transports.File({ filename: logName }),
  ],
});

export default {
  info: (msg: string, meta?: any) => logger.info(msg, { meta }),
  warn: (msg: string, meta?: any) => logger.warn(msg, { meta }),
  error: (msg: string, error?: any) => logger.error(msg, { error }),
  success: (msg: string, meta?: any) => logger.log("success", msg, { meta }),
  debug: (msg: string, meta?: any) => logger.debug(msg, { meta }),
};
