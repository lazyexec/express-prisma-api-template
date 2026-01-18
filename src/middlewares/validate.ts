import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import Joi from "joi";
import ApiError from "../utils/ApiError";

const validate =
  (schema: { body?: any; query?: any; params?: any }) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parts: Array<"body" | "query" | "params"> = [
      "body",
      "query",
      "params",
    ];

    try {
      for (const part of parts) {
        const s = schema[part];
        if (!s) continue;

        const data = (req as any)[part] || {};
        const { error, value } = s.validate(data, {
          abortEarly: true,
        });

        if (error) {
          return next(
            new ApiError(httpStatus.BAD_REQUEST, error.details[0].message)
          );
        }

        if (part === "query" || part === "params") {
          Object.assign((req as any)[part], value);
        } else {
          (req as any)[part] = value;
        }
      }

      return next();
    } catch (err) {
      return next(new ApiError(httpStatus.BAD_REQUEST, (err as Error).message));
    }
  };

export default validate;
