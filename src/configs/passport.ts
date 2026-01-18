import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import config from "./variables";
import prisma from "./prisma";
import { tokenType } from "./tokens";
import passport from "passport";
import logger from "../utils/logger";

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload: any, done: any) => {
  try {
    if (payload.type !== tokenType.ACCESS) {
      logger.warn("Invalid token type attempted", { type: payload.type });
      throw new Error("Invalid token type");
    }

    if (!payload.sub) {
      logger.warn("Missing subject claim in token");
      throw new Error("Missing subject claim");
    }
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      logger.warn("User not found for token", { userId: payload.sub });
      return done(null, false, { message: "User not found" });
    }

    // Additional security checks can be added here:
    // - Check if user's password was changed after token was issued
    // - Check if user's role was changed
    // - Check if user has 2FA enabled and verified

    done(null, user);
  } catch (error: any) {
    logger.error("JWT verification error", { error: error.message });
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

passport.use(jwtStrategy);

export default {
  jwtStrategy,
};
