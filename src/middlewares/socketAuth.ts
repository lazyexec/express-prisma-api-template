import type { Socket } from "socket.io";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import auth from "./auth";
import type { NextFunction, Request, Response } from "express";

export default async function socketAuth(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Authentication error")
      );
    }

    const req = {
      headers: {
        authorization: token.startsWith("Bearer") ? token : `Bearer ${token}`,
      },
    } as Request;
    const res = {} as Response;

    await auth()(req, res, (err) => {
      if (err) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, "Authentication error")
        );
      }
      // @ts-ignore
      socket.user = req.user;
      next();
    });
  } catch (error) {
    next(new ApiError(httpStatus.UNAUTHORIZED, "Authentication error"));
  }
}
