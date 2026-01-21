import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import AppleStrategy from "passport-apple";
import GoogleStrategy from "passport-google-oauth20";
import config from "./variables";
import prisma from "./prisma";
import httpStatus from "http-status";
import { tokenType } from "./tokens";
import passport from "passport";
import logger from "../utils/logger";
import ApiError from "../utils/ApiError";

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    (req: any) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies["accessToken"];
      }
      return token;
    },
  ]),
};

const appleOptions: AppleStrategy.AuthenticateOptions = {
  clientID: config.apple.clientId!,
  teamID: config.apple.teamId!,
  keyID: config.apple.keyId!,
  privateKeyString: config.apple.privateKey,
  callbackURL: config.apple.callbackUrl,
  passReqToCallback: false,
};

const googleOptions: GoogleStrategy.StrategyOptions = {
  clientID: config.google.clientId!,
  clientSecret: config.google.clientSecret!,
  callbackURL: config.google.callbackUrl,
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

const googleVerify = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any,
) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(
        new ApiError(
          httpStatus.BAD_REQUEST,
          "No email found in Google profile",
        ),
        false,
      );
    }
    let user = await prisma.user.findFirst({
      where: { email },
    });

    const googleAvatar = profile.photos?.[0]?.value;
    const defaultAvatar = "/uploads/users/user.png";

    if (user) {
      const dataToUpdate: any = {};
      if (!user.googleId) {
        dataToUpdate.googleId = profile.id;
      }
      // Update avatar if user has no avatar or has the default avatar
      if (googleAvatar && (!user.avatar || user.avatar === defaultAvatar)) {
        dataToUpdate.avatar = googleAvatar;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate,
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          googleId: profile.id,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          avatar: googleAvatar || defaultAvatar,
          isEmailVerified: true,
        },
      });
    }

    done(null, user);
  } catch (error: any) {
    logger.error("Google verification error", { error: error.message });
    done(error, false);
  }
};

const appleVerify = async (
  accessToken: string,
  refreshToken: string,
  idToken: any,
  profile: any,
  done: any,
) => {
  try {
    const email = profile?.email || idToken?.email;
    const appleId = profile?.id || idToken?.sub;

    if (!email || !appleId) {
      if (appleId) {
        const userByAppleId = await prisma.user.findUnique({
          where: { appleId },
        });
        if (userByAppleId) return done(null, userByAppleId);
      }
      return done(
        new ApiError(httpStatus.BAD_REQUEST, "No email or Apple ID found"),
        false,
      );
    }

    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      if (!user.appleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { appleId },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          appleId,
          firstName: profile?.name?.firstName,
          lastName: profile?.name?.lastName,
          isEmailVerified: true,
        },
      });
    }

    done(null, user);
  } catch (error: any) {
    logger.error("Apple verification error", { error: error.message });
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

passport.use(jwtStrategy);
if (config.google.clientId && config.google.clientSecret) {
  const googleStrategy = new GoogleStrategy.Strategy(googleOptions, googleVerify);
  passport.use(googleStrategy);
  logger.info("Google OAuth strategy registered");
} else {
  logger.warn("Google OAuth credentials not configured - strategy disabled");
}

if (config.apple.clientId && config.apple.teamId && config.apple.keyId && config.apple.privateKey) {
  const appleStrategy = new AppleStrategy.Strategy(appleOptions, appleVerify);
  passport.use(appleStrategy);
  logger.info("Apple OAuth strategy registered");
} else {
  logger.warn("Apple OAuth credentials not configured - strategy disabled");
}

export default {
  jwtStrategy,
};
