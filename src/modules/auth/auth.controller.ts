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
  const { refreshToken } = req.body;
  const userId = req.user?.id; // From auth middleware

  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken, userId);
  }

  logger.info("User logged out", {
    userId,
    deviceName: req.device?.deviceName,
    ip: req.device?.ip,
  });

  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: req.str("auth.logout_success"),
    }),
  );
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  const token = await tokenService.refreshAuth(refreshToken, {
    userId: user?.id!,
    deviceId: req.device?.deviceId,
    deviceName: req.device?.deviceName || "Unknown Device",
    userAgent: req.device?.userAgent || req.get("User-Agent"),
    ipAddress: req.device?.ip,
  });
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

export default {
  register,
  login,
  verifyAccount,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  reqVerifyAccount,
  resendOtp,
};
