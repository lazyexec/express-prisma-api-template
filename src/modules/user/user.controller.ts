import catchAsync from "../../utils/catchAsync";
import type { Request, Response } from "express";
import userService from "./user.service";
import ApiError from "../../utils/ApiError";
import httpStatus from "http-status";
import response from "../../utils/response";
import pick from "../../utils/pick";

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }
  const user = await userService.getUserById(userId);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User profile retrieved successfully",
      data: user,
    })
  );
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const files: any = req.files;
  const body = req.body;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }
  const user = await userService.updateUser(userId, body, files);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User profile Updated successfully",
      data: user,
    })
  );
});

const queryAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, [
    "role",
    "isDeleted",
    "email",
    "name",
    "phoneNumber",
  ]);
  const options = pick(req.query, ["page", "limit", "sort"]);
  const users = await userService.queryAllUsers(filter, options);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "Users retrieved successfully",
      data: users,
    })
  );
});

const restrictUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.userId as string;
  const user = await userService.restrictUser(userId, req.body.reason);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User restricted successfully",
      data: user,
    })
  );
});

const unrestrictUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.userId as string;
  const user = await userService.unRestrictUser(userId);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User unrestricted successfully",
      data: user,
    })
  );
});

const getProfileById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.userId as string;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }
  const user = await userService.getUserById(userId);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User profile retrieved successfully",
      data: user,
    })
  );
});

const addUser = catchAsync(async (req: Request, res: Response) => {
  const files: any = req.files;
  const user = await userService.addUser({ ...req.body, files });
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User profile Added successfully",
      data: user,
    })
  );
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.userId as string;
  await userService.deleteUser(userId);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User Deleted successfully",
      data: {},
    })
  );
});

const recoverUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.userId as string;
  await userService.recoverUser(userId);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "User Recovered successfully",
      data: {},
    })
  );
});

export default {
  getProfile,
  updateProfile,
  queryAllUsers,
  restrictUser,
  unrestrictUser,
  getProfileById,
  addUser,
  deleteUser,
  recoverUser,
};
