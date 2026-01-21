import catchAsync from "../../utils/catchAsync";
import type { Request, Response } from "express";
import pick from "../../utils/pick";
import tokenService from "./token.service";
import response from "../../utils/response";
import httpStatus from "http-status";

const querySessions = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["sort", "limit", "page"]);
  const filters = pick(req.query, ["email", "type"]);
  const sessions = await tokenService.listUserSessions(filters, options);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "Sessions retrieved successfully",
      data: sessions,
    }),
  );
});

const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const { userId, tokenId } = req.params;
  await tokenService.revokeSession(userId as string, tokenId as string);
  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "Session revoked successfully",
      data: {},
    }),
  );
});
export default { querySessions, revokeSession };
