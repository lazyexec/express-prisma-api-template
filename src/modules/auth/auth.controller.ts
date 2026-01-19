import catchAsync from "../../utils/catchAsync";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import userService from "../user/user.service";
import authService from "./auth.service";
import ApiError from "../../utils/ApiError";
import response from "../../utils/response";
import tokenService from "../token/token.service";
import { IUser } from "../user/user.interface";
import logger from "../../utils/logger";
import passport from "passport";
import variables from "../../configs/variables";

const register = catchAsync(async (req: Request, res: Response) => {
  await authService.register(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      status: httpStatus.CREATED,
      message: req.str("auth.register_success"),
    }),
  );
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password, fcmToken, rememberMe = false } = req.body;

  // Authenticate user
  const user = await authService.login(email, password);

  // Generate tokens with enhanced device information
  const token = await tokenService.generateLoginTokens({
    userId: user?.id!,
    deviceId: req.device?.deviceId,
    deviceName: req.device?.deviceName || "Unknown Device",
    userAgent: req.device?.userAgent || req.get("User-Agent"),
    ipAddress: req.device?.ip,
    rememberMe: rememberMe,
    metadata: {
      fingerprint: req.device?.fingerprint,
      deviceType: req.device?.deviceType,
      browser: req.device?.browser,
      os: req.device?.os,
      timezone: req.device?.timezone,
      isBot: req.device?.isBot,
    },
  });

  console.log(req.device);

  if (fcmToken) {
    await userService.updateUser(user?.id!, { fcmToken }, {});
  }

  logger.info("User logged in successfully", {
    userId: user?.id,
    email: user?.email,
    deviceName: req.device?.deviceName,
    ip: req.device?.ip,
    timestamp: new Date().toISOString(),
  });

  tokenService.setAuthCookies(res, token);

  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.login_success"),
      data: user,
      token,
    }),
  );
});

const verifyAccount = catchAsync(async (req: Request, res: Response) => {
  const { email, code, rememberMe = false } = req.body;
  const user = await authService.verifyAccount(email, code);
  const token = await tokenService.generateLoginTokens({
    userId: user?.id!,
    deviceId: req.device?.deviceId,
    deviceName: req.device?.deviceName || "Unknown Device",
    userAgent: req.device?.userAgent || req.get("User-Agent"),
    ipAddress: req.device?.ip,
    rememberMe: rememberMe,
    metadata: {
      fingerprint: req.device?.fingerprint,
      deviceType: req.device?.deviceType,
      browser: req.device?.browser,
      os: req.device?.os,
      timezone: req.device?.timezone,
      isBot: req.device?.isBot,
    },
  });
  tokenService.setAuthCookies(res, token);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.verify_success"),
      data: user,
      token,
    }),
  );
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  const userId = req.user?.id; // From auth middleware

  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken, userId);
  }

  logger.info("User logged out", {
    userId,
    deviceName: req.device?.deviceName,
    ip: req.device?.ip,
  });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh-tokens" });

  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.logout_success"),
    }),
  );
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  console.log("refreshToken", refreshToken);
  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Refresh token is required");
  }
  const token = await tokenService.refreshAuth(refreshToken, {
    userId: "", // Dummy value, ignored by service which extracts ID from token
    deviceId: req.device?.deviceId,
    deviceName: req.device?.deviceName || "Unknown Device",
    userAgent: req.device?.userAgent || req.get("User-Agent"),
    ipAddress: req.device?.ip,
  });
  tokenService.setAuthCookies(res, token);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.refresh_token_success"),
      token,
    }),
  );
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await authService.forgotPassword(email);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.forgot_password_sent"),
    }),
  );
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;
  await authService.resetPassword(email, otp, password);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.reset_password_success"),
    }),
  );
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const user: any = req.user;
  await authService.changePassword(user?.id, oldPassword, newPassword);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.change_password_success"),
    }),
  );
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  await authService.deleteAccount(user?.id);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.delete_account_success"),
    }),
  );
});

const reqVerifyAccount = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
  }
  await authService.reqVerifyAccount(user as IUser);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.verify_email_sent"),
    }),
  );
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
  }
  await authService.resendOtp(email);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.resend_otp_success"),
    }),
  );
});

const oauth = catchAsync(async (req: Request, res: Response, next: any) => {
  const { provider } = req.params;
  if (!provider) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Provider is required");
  }
  // Google requires 'profile' and 'email'. Apple behavior varies but 'email' 'name' is standard.
  const scope = provider === "google" ? ["profile", "email"] : [];
  passport.authenticate(provider, { scope, session: false })(req, res, next);
});

const oauthCallback = catchAsync(
  async (req: Request, res: Response, next: any) => {
    const { provider } = req.params;
    if (!provider) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Provider is required");
    }

    passport.authenticate(
      provider,
      { session: false },
      async (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.redirect(
            `${process.env.FRONTEND_URL}/login?error=auth_failed`,
          );
        }

        try {
          const token = await tokenService.generateLoginTokens({
            userId: user.id,
            deviceId: req.device?.deviceId,
            deviceName: req.device?.deviceName || "Unknown Device",
            userAgent: req.device?.userAgent || req.get("User-Agent"),
            ipAddress: req.device?.ip,
            rememberMe: true,
          });

          tokenService.setAuthCookies(res, token);

          return res.redirect(
            `${variables.FRONTEND_URL}/login?success=auth_success`,
          );
        } catch (error) {
          return next(error);
        }
      },
    )(req, res, next);
  },
);

const loginWithOAuth = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const result = await authService.loginWithOAuth(body);

  const token = await tokenService.generateLoginTokens({
    userId: result.id, // Now accessing result.user.id
    deviceId: req.device?.deviceId,
    deviceName: req.device?.deviceName,
    userAgent: req.device?.userAgent,
    ipAddress: req.device?.ip,
    rememberMe: true,
    metadata: {
      fingerprint: req.device?.fingerprint,
      deviceType: req.device?.deviceType,
      browser: req.device?.browser,
      os: req.device?.os,
      timezone: req.device?.timezone,
      isBot: req.device?.isBot,
    },
  });

  // Update FCM token if provided
  if (body.fcmToken) {
    await userService.updateUser(
      result.id,
      { fcmToken: body.fcmToken },
      {},
    );
  }

  logger.info("User logged in via OAuth", {
    userId: result.id,
    email: result.email,
    provider: body.provider,
    deviceName: req.device?.deviceName,
    ip: req.device?.ip,
  });

  // tokenService.setAuthCookies(res, token);

  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.login_success"),
      data: result,
      token,
    }),
  );
});

export default {
  register,
  login,
  verifyAccount,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  reqVerifyAccount,
  resendOtp,
  oauth,
  oauthCallback,
  loginWithOAuth,
  deleteAccount,
};
