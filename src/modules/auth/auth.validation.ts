import { z } from "zod";
import { roles } from "../../configs/roles";
import validator from "../../utils/validation";

const register = {
  body: z.object({
    firstName: z.string().min(3).max(30),
    lastName: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().refine(validator.password, {
      message:
        "password must be at least 8 characters and contain at least 1 letter and 1 number",
    }),
    role: z.enum(roles as [string, ...string[]]),
  }),
};

const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    fcmToken: z.string().optional(),
  }),
};

const verifyAccount = {
  body: z.object({
    email: z.string().email(),
    code: z.string(),
  }),
};

const logout = {
  body: z.object({
    refreshToken: z.string().optional(),
  }),
};

const refreshTokens = {
  body: z.object({
    refreshToken: z.string().optional(),
  }),
};

const forgotPassword = {
  body: z.object({
    email: z.string().email(),
  }),
};

const resetPassword = {
  body: z.object({
    email: z.string().email(),
    otp: z.string(),
    password: z.string().refine(validator.password, {
      message:
        "password must be at least 8 characters and contain at least 1 letter and 1 number",
    }),
  }),
};

const changePassword = {
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(6).max(100),
  }),
};

const resendOtp = {
  body: z.object({
    email: z.string().email(),
  }),
};

const oauth = {
  params: z.object({
    provider: z.string(),
  }),
};

const oauthCallback = {
  params: z.object({
    provider: z.string(),
  }),
};

const loginWithOAuth = {
  body: z.object({
    provider: z.enum(["google", "apple"]),
    oauthId: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    email: z.string().email(),
    avatar: z.string().optional(),
    fcmToken: z.string().optional(),
  }),
};

export default {
  register,
  login,
  verifyAccount,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  resendOtp,
  oauth,
  oauthCallback,
  loginWithOAuth,
};
