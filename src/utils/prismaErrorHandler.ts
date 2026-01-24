import { Prisma } from "@prisma/client";
import ApiError from "./ApiError";
import httpStatus from "http-status";
import logger from "./logger";

/**
 * Prisma Error Handler
 * Converts Prisma errors into user-friendly API errors
 */

const handlePrismaError = (error: any): ApiError => {
  // Log the original error for debugging
  logger.error("Prisma error occurred", {
    code: error.code,
    meta: error.meta,
    message: error.message,
  });

  // P2000: Value too long for column
  if (error.code === "P2000") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `The provided value is too long for the field: ${error.meta?.column_name || "unknown"}`,
    );
  }

  // P2001: Record not found
  if (error.code === "P2001") {
    return new ApiError(
      httpStatus.NOT_FOUND,
      `Record not found: ${error.meta?.cause || "The requested resource does not exist"}`,
    );
  }

  // P2002: Unique constraint violation
  if (error.code === "P2002") {
    const fields = error.meta?.target || ["field"];
    return new ApiError(
      httpStatus.CONFLICT,
      `A record with this ${Array.isArray(fields) ? fields.join(", ") : fields} already exists`,
    );
  }

  // P2003: Foreign key constraint violation
  if (error.code === "P2003") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid reference: ${error.meta?.field_name || "Related record does not exist"}`,
    );
  }

  // P2004: Constraint failed
  if (error.code === "P2004") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Database constraint failed: ${error.meta?.constraint || "unknown"}`,
    );
  }

  // P2005: Invalid value for field type
  if (error.code === "P2005") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid value provided for field: ${error.meta?.field_name || "unknown"}`,
    );
  }

  // P2006: Invalid value
  if (error.code === "P2006") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid value: ${error.meta?.field_name || "unknown"}`,
    );
  }

  // P2007: Data validation error
  if (error.code === "P2007") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Data validation error: ${error.meta?.database_error || "unknown"}`,
    );
  }

  // P2008: Failed to parse query
  if (error.code === "P2008") {
    return new ApiError(httpStatus.BAD_REQUEST, "Failed to parse the query");
  }

  // P2009: Failed to validate query
  if (error.code === "P2009") {
    return new ApiError(httpStatus.BAD_REQUEST, "Failed to validate the query");
  }

  // P2010: Raw query failed
  if (error.code === "P2010") {
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Database query failed",
    );
  }

  // P2011: Null constraint violation
  if (error.code === "P2011") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Required field is missing: ${error.meta?.constraint || "unknown"}`,
    );
  }

  // P2012: Missing required value
  if (error.code === "P2012") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required value: ${error.meta?.path || "unknown"}`,
    );
  }

  // P2013: Missing required argument
  if (error.code === "P2013") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required argument: ${error.meta?.argument_name || "unknown"}`,
    );
  }

  // P2014: Relation violation
  if (error.code === "P2014") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid relation: ${error.meta?.relation_name || "unknown"}`,
    );
  }

  // P2015: Related record not found
  if (error.code === "P2015") {
    return new ApiError(httpStatus.NOT_FOUND, "Related record not found");
  }

  // P2016: Query interpretation error
  if (error.code === "P2016") {
    return new ApiError(httpStatus.BAD_REQUEST, "Query interpretation error");
  }

  // P2017: Records not connected
  if (error.code === "P2017") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      `Records are not connected: ${error.meta?.relation_name || "unknown"}`,
    );
  }

  // P2018: Required connected records not found
  if (error.code === "P2018") {
    return new ApiError(
      httpStatus.NOT_FOUND,
      "Required connected records not found",
    );
  }

  // P2019: Input error
  if (error.code === "P2019") {
    return new ApiError(httpStatus.BAD_REQUEST, "Input error");
  }

  // P2020: Value out of range
  if (error.code === "P2020") {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      "Value out of range for the field type",
    );
  }

  // P2021: Table does not exist
  if (error.code === "P2021") {
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Database table does not exist",
    );
  }

  // P2022: Column does not exist
  if (error.code === "P2022") {
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Database column does not exist",
    );
  }

  // P2023: Inconsistent column data
  if (error.code === "P2023") {
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Inconsistent column data",
    );
  }

  // P2024: Connection pool timeout
  if (error.code === "P2024") {
    return new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Database connection timeout. Please try again",
    );
  }

  // P2025: Record to delete/update not found
  if (error.code === "P2025") {
    return new ApiError(
      httpStatus.NOT_FOUND,
      error.meta?.cause || "Record not found or already deleted",
    );
  }

  // P2026: Unsupported database feature
  if (error.code === "P2026") {
    return new ApiError(httpStatus.BAD_REQUEST, "Unsupported database feature");
  }

  // P2027: Multiple database errors
  if (error.code === "P2027") {
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Multiple database errors occurred",
    );
  }

  // P2028: Transaction API error
  if (error.code === "P2028") {
    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Transaction error");
  }

  // P2030: Fulltext index not found
  if (error.code === "P2030") {
    return new ApiError(httpStatus.BAD_REQUEST, "Fulltext index not found");
  }

  // P2033: Number out of range
  if (error.code === "P2033") {
    return new ApiError(httpStatus.BAD_REQUEST, "Number value is out of range");
  }

  // P2034: Transaction conflict
  if (error.code === "P2034") {
    return new ApiError(
      httpStatus.CONFLICT,
      "Transaction conflict. Please try again",
    );
  }

  // Default: Unknown Prisma error
  return new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected database error occurred",
  );
};

/**
 * Check if error is a Prisma error
 */
const isPrismaError = (error: any): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  );
};

/**
 * Handle different types of Prisma errors
 */
const handlePrismaErrorType = (error: any): ApiError => {
  // Known request errors (P2xxx codes)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Unknown request errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error("Unknown Prisma error", { message: error.message });
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "An unknown database error occurred",
    );
  }

  // Rust panic errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error("Prisma Rust panic", { message: error.message });
    return new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "A critical database error occurred",
    );
  }

  // Initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error("Prisma initialization error", { message: error.message });
    return new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Database connection failed",
    );
  }

  // Validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error("Prisma validation error", { message: error.message });
    return new ApiError(httpStatus.BAD_REQUEST, "Invalid data provided");
  }

  // Fallback
  return new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred",
  );
};

export default {
  handlePrismaError,
  isPrismaError,
  handlePrismaErrorType,
};
