import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { z, ZodSchema, ZodError, ZodIssue } from "zod";
import ApiError from "../utils/ApiError";

const validate =
  (schema: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Helper function to apply strict mode to ZodObject schemas
      const makeStrict = (zodSchema: ZodSchema | undefined) => {
        if (!zodSchema) return z.object({}).passthrough();

        // Check if the schema has a strict method (ZodObject does)
        if (typeof (zodSchema as any).strict === "function") {
          return (zodSchema as any).strict();
        }

        // If not a ZodObject, return as-is
        return zodSchema;
      };

      const validationSchema = z.object({
        body: makeStrict(schema.body),
        query: makeStrict(schema.query),
        params: makeStrict(schema.params),
      });

      const parsedData = await validationSchema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Store validated data - req.query is read-only, so we use a custom property
      if (schema.body) req.body = parsedData.body;
      if (schema.query) {
        // Store validated query in a custom property since req.query is read-only
        (req as any).validatedQuery = parsedData.query;
      }
      if (schema.params) req.params = parsedData.params as any;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((details: ZodIssue) => {
            const path = details.path.join(".");
            return path ? `${path}: ${details.message}` : details.message;
          })
          .join(", ");
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
      }
      return next(
        new ApiError(httpStatus.BAD_REQUEST, (error as Error).message),
      );
    }
  };

export default validate;
