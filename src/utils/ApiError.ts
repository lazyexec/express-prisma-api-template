import httpStatus from "http-status";

class ApiError extends Error {
  status: keyof typeof httpStatus;
  isOperational: boolean;

  constructor(
    status: keyof typeof httpStatus,
    message: string,
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace?.(this, this.constructor);
    }
  }
}

export default ApiError;
