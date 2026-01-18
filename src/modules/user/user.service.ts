import email from "../../configs/email";
import ApiError from "../../utils/ApiError";
import httpStatus from "http-status";
import fs from "../../utils/fs";
import env from "../../configs/variables";
import { IUser } from "./user.interface";
import prisma from "../../configs/prisma";

interface UploadedFiles {
  avatar?: Express.Multer.File[];
  documents?: Express.Multer.File[];
}

const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

const updateUser = async (
  userId: string,
  updateBody: any,
  files: UploadedFiles
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const data: any = { ...updateBody };

  if (files?.avatar?.[0]) {
    if (user.avatar) {
      fs.deleteLocalFile(user.avatar);
    }
    const file = files.avatar[0];
    data.avatar = env.BACKEND_URL + "/public" + fs.sanitizePath(file.path);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data,
  });

  return updatedUser as unknown as IUser;
};

const getUserById = async (userId: string) => {
  return (await prisma.user.findUnique({
    where: { id: userId },
  })) as unknown as IUser;
};

const queryAllUsers = async (filter: any, options: object) => {
  const query: any = {};

  for (const key of Object.keys(filter)) {
    if (!filter[key]) continue;

    if (key === "email" || key === "firstName" || key === "lastName") {
      query[key] = { contains: filter[key], mode: "insensitive" };
    } else if (key === "role") {
      query[key] = filter[key] as string;
    } else if (key === "name") {
      query["OR"] = [
        { firstName: { contains: filter[key], mode: "insensitive" } },
        { lastName: { contains: filter[key], mode: "insensitive" } },
      ];
    } else {
      query[key] = filter[key];
    }
  }

  const { limit = 10, page = 1, sort = { createdAt: "desc" } } = options as any;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [users, totalDocs] = await Promise.all([
    prisma.user.findMany({
      where: query,
      take,
      skip,
      orderBy: sort,
    }),
    prisma.user.count({ where: query }),
  ]);

  return {
    docs: users as unknown as IUser[],
    totalDocs,
    limit: take,
    page: Number(page),
    totalPages: Math.ceil(totalDocs / take),
  };
};

const restrictUser = async (userId: string, reason: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isRestricted: true, restrictionReason: reason },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await email.sendRestrictionEmail(user.email, reason);
};

const unRestrictUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isRestricted: false, restrictionReason: null },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await email.sendUnrestrictedEmail(user.email);
};

const deleteUser = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
  });
};

const recoverUser = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: false },
  });
};

const addUser = async ({
  firstName,
  lastName,
  email,
  role,
  password,
  files,
}: {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  files?: UploadedFiles;
}) => {
  let userObject: any = {
    firstName,
    lastName,
    email,
    role: role as string,
    password,
    isEmailVerified: true,
  };

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  if (files?.avatar?.[0]) {
    const file = files.avatar[0];
    userObject.avatar =
      env.BACKEND_URL + "/public" + fs.sanitizePath(file.path);
  }

  return prisma.user.create({ data: userObject });
};

export default {
  getUserByEmail,
  updateUser,
  getUserById,
  queryAllUsers,
  restrictUser,
  unRestrictUser,
  addUser,
  deleteUser,
  recoverUser,
};
