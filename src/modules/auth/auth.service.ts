import emailHelper from "../../configs/email";
import ApiError from "../../utils/ApiError";
import { randomOtp } from "../../utils/otp";
import http from "http-status";
import logger from "../../utils/logger";
import prisma from "../../configs/prisma";
import bcrypt from "bcrypt";
import userService from "../user/user.service";
import userSelect from "../user/user.select";
import { IUser } from "../user/user.interface";
import httpStatus from "http-status";

const createUser = async (userData: any) => {
  return await prisma.user.create({
    data: userData,
  });
};

const restoreUser = async (userId: string, userData: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data: userData,
  });
};

const register = async (userData: IUser) => {
  const otp = randomOtp();
  const oneTimeCode = otp;
  const oneTimeCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const { email, password, role, ...rest } = userData;

  const hashedPassword = await bcrypt.hash(password!, 8);

  const emailTaken = await userService.getUserByEmail(email);
  if (emailTaken && !emailTaken.isDeleted) {
    throw new ApiError(http.BAD_REQUEST, "Email already taken");
  } else if (emailTaken && emailTaken.isDeleted) {
    await restoreUser(emailTaken.id, {
      email,
      password: hashedPassword,
      isDeleted: false,
      isEmailVerified: false,
      oneTimeCode,
      oneTimeCodeExpires,
      role,
      ...rest,
    });
  } else {
    await createUser({
      email,
      password: hashedPassword,
      oneTimeCode,
      oneTimeCodeExpires,
      role,
      ...rest,
    });
  }

  setImmediate(() => {
    emailHelper
      .sendRegistrationEmail(email, otp)
      .catch((err) => logger.error("Error sending registration email: " + err));
  });
  return true;
};

const verifyAccount = async (email: string, code: string) => {
  const user = await prisma.user.findFirst({
    where: { email, oneTimeCode: code },
  });
  if (!user) {
    throw new ApiError(http.FORBIDDEN, "Invalid code or email");
  }
  if (user.isEmailVerified && !user.isResetPassword) {
    throw new ApiError(http.BAD_REQUEST, "Email is already verified");
  }
  if (user.oneTimeCodeExpires && user.oneTimeCodeExpires < new Date()) {
    await prisma.user.update({
      where: { email },
      data: { oneTimeCode: null, oneTimeCodeExpires: null },
    });
    throw new ApiError(http.FORBIDDEN, "OTP has expired");
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      oneTimeCode: null,
      oneTimeCodeExpires: null,
    },
    select: userSelect.getUserSelect,
  });
  return updatedUser;
};

const login = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.UNAUTHORIZED, "Incorrect email or password");
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password || "");
  if (!isPasswordMatch) {
    throw new ApiError(http.UNAUTHORIZED, "Incorrect email or password");
  }
  const filteredUser = await prisma.user.findFirst({
    where: { id: user.id },
    select: userSelect.getUserSelect,
  });
  return filteredUser;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.NOT_FOUND, "User not found");
  }
  const otp = randomOtp();
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      oneTimeCode: otp,
      oneTimeCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      isResetPassword: true,
    },
  });
  await emailHelper.sendResetPasswordEmail(user.email, otp);
  return updatedUser;
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.UNAUTHORIZED, "User not found");
  }
  if (user.oneTimeCode !== otp) {
    throw new ApiError(http.FORBIDDEN, "Invalid OTP code");
  }
  if (user.oneTimeCodeExpires && user.oneTimeCodeExpires < new Date()) {
    throw new ApiError(http.FORBIDDEN, "OTP has expired");
  }
  const isSamePassword = await bcrypt.compare(newPassword, user.password || "");
  if (isSamePassword) {
    throw new ApiError(http.BAD_REQUEST, "New password cannot be same");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 8);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isResetPassword: false,
      oneTimeCode: null,
      oneTimeCodeExpires: null,
    },
  });
  return updatedUser;
};

const changePassword = async (
  userId: any,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.UNAUTHORIZED, "User not found");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(
      http.BAD_REQUEST,
      "New password must be different from the old password",
    );
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password || "");
  if (isSamePassword) {
    throw new ApiError(http.BAD_REQUEST, "New password cannot be same");
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 8);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });
  return updatedUser;
};

const deleteAccount = async (userId: any) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.UNAUTHORIZED, "User not found");
  }
  // TODO: Add Token model to Prisma schema if needed
  const token = await prisma.token.findFirst({
    where: { userId },
  });
  if (!token) {
    throw new ApiError(http.UNAUTHORIZED, "User not found");
  }
  await prisma.token.delete({
    where: { id: token.id },
  });
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
  });
  return updatedUser;
};

const reqVerifyAccount = async (user: any) => {
  if (user.isEmailVerified && !user.isResetPassword) {
    throw new ApiError(http.BAD_REQUEST, "Email is already verified");
  }

  if (user.oneTimeCodeExpires) {
    const resendAllowedAt =
      new Date(user.oneTimeCodeExpires).getTime() - 7 * 60 * 1000;
    if (Date.now() < resendAllowedAt) {
      throw new ApiError(
        http.TOO_MANY_REQUESTS,
        "Please wait before requesting a new verification code",
      );
    }
  }

  const userDoc = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!userDoc) {
    throw new ApiError(http.NOT_FOUND, "User not found");
  }

  const otp = randomOtp();
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      oneTimeCode: otp,
      oneTimeCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  setImmediate(() => {
    emailHelper
      .sendRegistrationEmail(updatedUser.email, otp)
      .catch((err) => logger.error(err));
  });

  return updatedUser;
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(http.NOT_FOUND, "Invalid Request!");
  }

  if (!user.oneTimeCode && !user.oneTimeCodeExpires) {
    throw new ApiError(http.BAD_REQUEST, "Bad Request!");
  }

  if (user.oneTimeCodeExpires) {
    const resendAllowedAt =
      new Date(user.oneTimeCodeExpires).getTime() - 7 * 60 * 1000;
    if (Date.now() < resendAllowedAt) {
      throw new ApiError(
        http.TOO_MANY_REQUESTS,
        "Please wait before requesting a new verification code",
      );
    }
  }

  const otp = randomOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      oneTimeCode: otp,
      oneTimeCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });
  if (user.isResetPassword) {
    await emailHelper.sendResetPasswordEmail(user.email, otp);
  } else {
    await emailHelper.sendRegistrationEmail(user.email, otp);
  }
};

const loginWithOAuth = async (oauthUser: {
  provider: "google" | "apple";
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}) => {
  const { provider, providerId, email, firstName, lastName, avatar } =
    oauthUser;

  const providerField = provider === "google" ? "googleId" : "appleId";

  // 1️⃣ Find by provider ID (MOST trusted)
  let user = await prisma.user.findUnique({
    where:
      provider === "google"
        ? { googleId: providerId }
        : { appleId: providerId },
  });

  // 2️⃣ Link by verified email
  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          [providerField]: providerId,
          isEmailVerified: true,
        },
      });
    }
  }

  // 3️⃣ Create new user
  if (!user) {
    if (!email) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Email required for first login",
      );
    }

    user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        avatar,
        [providerField]: providerId,
        isEmailVerified: true,
      },
    });
  }

  return user;
};

export default {
  register,
  verifyAccount,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  resendOtp,
  reqVerifyAccount,
  loginWithOAuth,
};
