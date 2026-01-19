import jwt from "jsonwebtoken";
import env from "../configs/variables";
import ApiError from "./ApiError";
import status from "http-status";
import crypto from "crypto";

export interface JWTPayload {
  sub: string; // Subject (user ID) - standard JWT claim
  type: string; // Token type (access/refresh)
  jti?: string; // JWT ID - unique token identifier
  iat?: number; // Issued at
  exp?: number; // Expiration time
  aud?: string; // Audience
  iss?: string; // Issuer
}

const decodeToken = (token: string): any => {
  const decoded = jwt.decode(token, { complete: true });
  return decoded;
};

const verifyToken = (token: string): JWTPayload => {
  try {
    const verified = jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    }) as JWTPayload;
    return verified;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(status.UNAUTHORIZED, "Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(status.FORBIDDEN, "Invalid token");
    }
    if (error.name === "NotBeforeError") {
      throw new ApiError(status.FORBIDDEN, "Token not yet valid");
    }
    throw new ApiError(status.FORBIDDEN, "Token verification failed");
  }
};

const generateToken = (
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn: string = env.jwt.expiryAccessToken
): string => {
  const jti = payload.jti || crypto.randomBytes(16).toString("hex");

  return jwt.sign(
    {
      ...payload,
      jti,
    },
    env.jwt.secret,
    {
      expiresIn: expiresIn as any,
      algorithm: "HS256",
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    }
  );
};

export default {
  decodeToken,
  verifyToken,
  generateToken,
};
