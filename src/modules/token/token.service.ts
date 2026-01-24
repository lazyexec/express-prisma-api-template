import jwt from "../../utils/jwt";
import ApiError from "../../utils/ApiError";
import status from "http-status";
import env from "../../configs/variables";
import { strToDate } from "../../utils/date";
import prisma from "../../configs/prisma";
import { IToken } from "./token.interface";
import { tokenType } from "@prisma/client";
import crypto from "crypto";
import logger from "../../utils/logger";
import type { CookieOptions, Response } from "express";
import variables from "../../configs/variables";
import { paginate, PaginationOptions } from "../../utils/paginate";
import { OAuth2Client } from "google-auth-library";
import jwksClient from "jwks-rsa";
import config from "../../configs/variables";
import httpStatus from "http-status";
import i18n from "../../utils/i18n";

const client = new OAuth2Client(config.google.clientId);
const jwks = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
});

const getKey = async (kid: string) => {
  const key = await jwks.getSigningKey(kid);
  return key.getPublicKey();
};

const saveToken = async (opts: {
  userId: string;
  token: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
  rememberMe?: boolean;
  tokenFamily?: string;
  replacesTokenId?: string;
  type?: tokenType;
  metadata?: any;
  expiresAt?: Date;
}) => {
  const {
    userId,
    token,
    deviceId = null,
    ipAddress = null,
    userAgent = null,
    deviceName = null,
    rememberMe = false,
    tokenFamily = null,
    replacesTokenId = null,
    type = tokenType.refresh,
    metadata = {},
    expiresAt = new Date(),
  } = opts;

  return await prisma.token.create({
    data: {
      token,
      userId,
      type,
      deviceId,
      deviceName,
      userAgent,
      tokenFamily,
      replacesTokenId,
      ipAddress,
      rememberMe,
      metadata,
      isRevoked: false,
      useCount: 0,
      expiresAt,
    },
  });
};

const generateLoginTokens = async (opts: IToken) => {
  const {
    userId,
    deviceId,
    deviceName,
    ipAddress,
    userAgent,
    rememberMe,
    metadata,
  } = opts;

  const accessToken = jwt.generateToken(
    { sub: userId, type: tokenType.access },
    env.jwt.expiryAccessToken,
  );
  const refreshToken = jwt.generateToken(
    { sub: userId, type: tokenType.refresh },
    env.jwt.expiryRefreshToken,
  );

  const tokenFamily = crypto.randomBytes(16).toString("hex");
  const expirationDays = rememberMe ? 30 : 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  await saveToken({
    userId,
    token: refreshToken,
    deviceId,
    deviceName,
    ipAddress,
    userAgent,
    expiresAt,
    rememberMe,
    tokenFamily,
    metadata,
  });

  logger.info("User tokens generated", { userId, deviceName });

  return {
    access: {
      token: accessToken,
      expiresAt: strToDate(env.jwt.expiryAccessToken),
    },
    refresh: {
      token: refreshToken,
      expiresAt,
    },
  };
};

const refreshAuth = async (refreshToken: string, opts: IToken) => {
  let payload: any;
  try {
    payload = jwt.verifyToken(refreshToken);
  } catch (err) {
    throw new ApiError(status.FORBIDDEN, "Invalid refresh token (signature).");
  }

  if (!payload || payload.type !== "refresh") {
    throw new ApiError(status.FORBIDDEN, "Token is not a refresh token.");
  }

  const tokenDoc = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: tokenType.refresh,
      isRevoked: false,
    },
  });

  if (!tokenDoc) {
    throw new ApiError(status.FORBIDDEN, "Refresh token not found or revoked.");
  }

  if (tokenDoc.expiresAt && tokenDoc.expiresAt.getTime() < Date.now()) {
    await prisma.token.delete({ where: { id: tokenDoc.id } }).catch(() => {});
    throw new ApiError(status.FORBIDDEN, "Refresh token expired.");
  }

  // Check for token reuse (security)
  if (tokenDoc.useCount > 0) {
    logger.error("Refresh token reuse detected", {
      userId: tokenDoc.userId,
      tokenFamily: tokenDoc.tokenFamily,
    });

    // Revoke entire token family
    if (tokenDoc.tokenFamily) {
      await prisma.token.updateMany({
        where: { tokenFamily: tokenDoc.tokenFamily },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "Token family revoked due to reuse",
        },
      });
    }

    throw new ApiError(
      status.FORBIDDEN,
      "Token reuse detected - all sessions revoked for security",
    );
  }

  // Mark old token as used and revoked (token rotation)
  await prisma.token.update({
    where: { id: tokenDoc.id },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 },
      isRevoked: true,
      revokedReason: "Token rotated",
    },
  });

  const userId = payload.sub;

  const newAccessToken = jwt.generateToken(
    { sub: userId, type: tokenType.access },
    env.jwt.expiryAccessToken,
  );
  const newRefreshToken = jwt.generateToken(
    { sub: userId, type: tokenType.refresh },
    env.jwt.expiryRefreshToken,
  );

  const expirationDays = tokenDoc.rememberMe ? 30 : 7;
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays);

  await saveToken({
    userId,
    token: newRefreshToken,
    deviceId: opts?.deviceId ?? tokenDoc.deviceId,
    deviceName: tokenDoc.deviceName,
    ipAddress: opts?.ipAddress ?? tokenDoc.ipAddress,
    userAgent: opts?.userAgent ?? tokenDoc.userAgent,
    expiresAt: newExpiresAt,
    rememberMe: tokenDoc.rememberMe,
    tokenFamily: tokenDoc.tokenFamily!, // KEEP SAME FAMILY
    replacesTokenId: tokenDoc.id, // Track chain
    metadata: tokenDoc.metadata,
  });

  logger.info("Tokens refreshed", { userId });

  return {
    access: {
      token: newAccessToken,
      expiresAt: strToDate(env.jwt.expiryAccessToken),
    },
    refresh: {
      token: newRefreshToken,
      expiresAt: newExpiresAt,
    },
  };
};

const revokeRefreshToken = async (token: string, reason = "user_logout") => {
  const tokenDoc = await prisma.token.updateMany({
    where: {
      token,
      type: tokenType.refresh,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
  return tokenDoc.count > 0;
};

const revokeAllForUser = async (
  userId: string,
  opts?: { reason?: string; deviceId?: string },
) => {
  await prisma.token.updateMany({
    where: {
      userId,
      type: tokenType.refresh,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: opts?.reason || "User logged out from all devices",
    },
  });
  return true;
};

const verifyAccessToken = (rawAccessToken: string) => {
  try {
    const payload = jwt.verifyToken(rawAccessToken);
    if (!payload) throw new Error("invalid token");
    if (payload.type !== tokenType.access)
      throw new Error("invalid token type");
    return payload;
  } catch (err) {
    throw new ApiError(status.UNAUTHORIZED, "Invalid access token.");
  }
};

const listUserSessions = async (options: PaginationOptions, filters: any) => {
  const queryFilters: any = {};
  console.log(options);
  if (filters.email) {
    queryFilters.user = {
      email: {
        contains: filters.email,
        mode: "insensitive",
      },
    };
  }
  if (filters.type) {
    queryFilters.type = filters.type;
  }
  return await paginate(prisma.token, options, queryFilters);
};

const revokeSession = async (userId: string, sessionId: string) => {
  const token = await prisma.token.findFirst({
    where: { id: sessionId, userId, type: tokenType.refresh },
  });

  if (!token) {
    throw new ApiError(status.NOT_FOUND, "Session not found");
  }

  await prisma.token.update({
    where: { id: sessionId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: "Revoked by user",
    },
  });

  return true;
};

const cleanupExpiredTokens = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.token.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isRevoked: true, revokedAt: { lt: thirtyDaysAgo } },
      ],
    },
  });

  logger.info("Expired tokens cleaned", { count: result.count });
  return result.count;
};

const setAuthCookies = (
  res: Response,
  token: {
    access: { token: string; expiresAt: Date };
    refresh: { token: string; expiresAt: Date };
  },
) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: !variables.DEBUG,
    sameSite: variables.DEBUG ? "lax" : "none",
  };

  res.cookie("accessToken", token.access.token, {
    ...cookieOptions,
    expires: token.access.expiresAt,
  });

  res.cookie("refreshToken", token.refresh.token, {
    ...cookieOptions,
    expires: token.refresh.expiresAt,
    path: "/api/v1/auth/refresh-tokens",
  });
};

const verifyGoogleIdToken = async (googleIdToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken: googleIdToken,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new ApiError(httpStatus.UNAUTHORIZED, i18n.str("common.went_wrong"));
  }

  if (!payload.email || payload.email_verified !== true) {
    throw new ApiError(httpStatus.UNAUTHORIZED, i18n.str("common.went_wrong"));
  }

  return {
    provider: "google" as const,
    providerId: payload.sub,
    email: payload.email,
    firstName: payload.given_name,
    lastName: payload.family_name,
    avatar: payload.picture,
  };
};

const verifyAppleIdToken = async (idToken: string) => {
  const decoded = jwt.decodeToken(idToken);

  if (!decoded || typeof decoded === "string") {
    throw new ApiError(httpStatus.UNAUTHORIZED, i18n.str("common.went_wrong"));
  }

  const publicKey = await getKey(decoded.header.kid);

  const payload: any = jwt.jwt.verify(idToken, publicKey, {
    audience: config.apple.clientId,
    issuer: "https://appleid.apple.com",
  });

  return {
    provider: "apple" as const,
    providerId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    avatar: payload.picture || null,
  };
};

export default {
  generateLoginTokens,
  refreshAuth,
  revokeRefreshToken,
  revokeAllForUser,
  verifyAccessToken,
  listUserSessions,
  revokeSession,
  cleanupExpiredTokens,
  setAuthCookies,
  verifyGoogleIdToken,
  verifyAppleIdToken,
  // Oauth Verify
};
