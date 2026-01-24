import type { Request, Response, NextFunction } from "express";
import prismaErrorHandler from "./prismaErrorHandler";
import logger from "./logger";

const catchAsync =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Check if it's a Prisma error and convert it
      if (prismaErrorHandler.isPrismaError(err)) {
        logger.error(err);
        const apiError = prismaErrorHandler.handlePrismaErrorType(err);
        return next(apiError);
      }
      // Pass other errors as-is
      next(err);
    });
  };

export default catchAsync;
