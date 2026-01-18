import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { roleRights } from "../configs/roles";
import prisma from "../configs/prisma";
import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import all_permissions from "../configs/permissions";
import logger from "../utils/logger";

const verifyCallback =
  (
    req: Request,
    resolve: () => void,
    reject: (error: ApiError) => void,
    requiredRights: string[]
  ) =>
    async (err: Error | null, user: any | false, info: any) => {
      if (err) {
        logger.error("Authentication error", { error: err.message });
        return reject(
          new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Authentication error")
        );
      }

      if (info) {
        logger.warn("Authentication failed", { reason: info.message || info });
      }

      if (info || !user) {
        return reject(
          new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized")
        );
      }

      if (user.isDeleted) {
        logger.warn("Deleted user attempted access", { userId: user.id });
        return reject(new ApiError(httpStatus.UNAUTHORIZED, "User Not Found!"));
      }

      if (user.isRestricted) {
        logger.warn("Restricted user attempted access", { userId: user.id });
        return reject(
          new ApiError(
            httpStatus.FORBIDDEN,
            "User is restricted, Please contact support"
          )
        );
      }

      req.user = user;

      // Then check permissions
      if (requiredRights.length > 0) {
        const userRights = await getUserPermissions(user);
        const hasRequiredRights = requiredRights.some((right) =>
          userRights.includes(right)
        );

        if (!hasRequiredRights) {
          logger.warn("Insufficient permissions", {
            userId: user.id,
            required: requiredRights,
            has: userRights
          });
          return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden!"));
        }
      }

      resolve();
    };

const getUserPermissions = async (user: any): Promise<string[]> => {
  return roleRights.get(user.role) || [];
};

const auth =
  (...requiredRights: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      return new Promise<void>((resolve, reject) => {
        passport.authenticate(
          "jwt",
          { session: false },
          verifyCallback(req, resolve, reject, requiredRights)
        )(req, res, (err?: any) => {
          if (err) {
            return next(err);
          }
        });
      })
        .then(() => next())
        .catch((err) => next(err));
    };

export default auth;
