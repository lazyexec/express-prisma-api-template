import Joi from "joi";
import { roles } from "../../configs/roles";
import validator from "../../utils/validator";

const register = {
  body: Joi.object()
    .keys({
      firstName: Joi.string().min(3).max(30).required(),
      lastName: Joi.string().min(3).max(30).required(),
      email: Joi.string().required(),
      password: Joi.custom(validator.password).required(),
      role: Joi.string()
        .valid(...roles)
        .required(),
    })
    .required(),
};

const login = {
  body: Joi.object()
    .keys({
      email: Joi.string().required(),
      password: Joi.string().required(),
      fcmToken: Joi.string().optional(),
    })
    .required(),
};

const verifyAccount = {
  body: Joi.object()
    .keys({
      email: Joi.string().required(),
      code: Joi.string().required(),
    })
    .required(),
};

const logout = {
  body: Joi.object()
    .keys({
      refreshToken: Joi.string().required(),
    })
    .required(),
};

const refreshTokens = {
  body: Joi.object()
    .keys({
      refreshToken: Joi.string().required(),
    })
    .required(),
};

const forgotPassword = {
  body: Joi.object()
    .keys({
      email: Joi.string().required(),
    })
    .required(),
};

const resetPassword = {
  body: Joi.object()
    .keys({
      email: Joi.string().required(),
      otp: Joi.string().required(),
      password: Joi.custom(validator.password).required(),
    })
    .required(),
};

const changePassword = {
  body: Joi.object()
    .keys({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).max(100).required(),
    })
    .required(),
};

const resendOtp = {
  body: Joi.object()
    .keys({
      email: Joi.string().required(),
    })
    .required(),
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
};
