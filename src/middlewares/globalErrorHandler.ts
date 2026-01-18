import env from "../configs/variables";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import logger from "../utils/logger";
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client";

const errorConverter = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let status: keyof typeof httpStatus = httpStatus.INTERNAL_SERVER_ERROR;
    let message: string = error.message || httpStatus[status];

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          // Unique constraint violation
          status = httpStatus.CONFLICT;
          const target = error.meta?.target as string[] | undefined;
          message = `Duplicate value for ${target?.join(", ") || "field"}. This record already exists.`;
          break;

        case "P2025":
          // Record not found
          status = httpStatus.NOT_FOUND;
          message = "Record not found or already deleted.";
          break;

        case "P2003":
          // Foreign key constraint failed
          status = httpStatus.BAD_REQUEST;
          message = "Invalid reference. The related record does not exist.";
          break;

        case "P2014":
          // Required relation violation
          status = httpStatus.BAD_REQUEST;
          message = "The change would violate a required relation.";
          break;

        case "P2015":
          // Related record not found
          status = httpStatus.NOT_FOUND;
          message = "Related record not found.";
          break;

        case "P2016":
          // Query interpretation error
          status = httpStatus.BAD_REQUEST;
          message = "Query interpretation error. Please check your input.";
          break;

        case "P2021":
          // Table does not exist
          status = httpStatus.INTERNAL_SERVER_ERROR;
          message = "Database table does not exist.";
          break;

        case "P2022":
          // Column does not exist
          status = httpStatus.INTERNAL_SERVER_ERROR;
          message = "Database column does not exist.";
          break;

        default:
          status = httpStatus.BAD_REQUEST;
          message = `Database error: ${error.message}`;
      }
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Unknown database error
      status = httpStatus.INTERNAL_SERVER_ERROR;
      message = "An unknown database error occurred.";
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      // Prisma engine panic
      status = httpStatus.INTERNAL_SERVER_ERROR;
      message = "Database engine error occurred.";
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      // Database connection error
      status = httpStatus.SERVICE_UNAVAILABLE;
      message = "Unable to connect to the database.";
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      // Validation error (invalid query)
      status = httpStatus.BAD_REQUEST;
      message = "Invalid request. Please check your input data.";
    } else {
      // Generic errors
      status = error.status || httpStatus.INTERNAL_SERVER_ERROR;
    }

    error = new ApiError(status, message, false, err.stack);
  }

  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { status, message } = err;

  if (env.DEBUG && !err.isOperational) {
    status = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: status,
    message,
    ...(env.DEBUG && { stack: err.stack }),
  };

  if (env.DEBUG) {
    logger.error(err);
  }

  res.status(status).send(response);
};

export { errorConverter, errorHandler };