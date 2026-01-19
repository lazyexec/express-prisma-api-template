import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { z, ZodSchema, ZodError, ZodIssue } from "zod";
import ApiError from "../utils/ApiError";

const validate =
  (schema: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationSchema = z.object({
          body: schema.body ?? z.any(),
          query: schema.query ?? z.any(),
          params: schema.params ?? z.any(),
        });

        const parsedData = await validationSchema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (schema.body) req.body = parsedData.body;
        if (schema.query) req.query = parsedData.query;
        if (schema.params) req.params = parsedData.params;

        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errorMessage = (error as any).errors
            .map((details: ZodIssue) => {
              const path = details.path.join(".");
              return path ? `${path}: ${details.message}` : details.message;
            })
            .join(", ");
          return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
        }
        return next(new ApiError(httpStatus.BAD_REQUEST, (error as Error).message));
      }
    };

export default validate;
