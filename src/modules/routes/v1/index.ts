import express, { Router } from "express";
import authRouter from "../../auth/auth.route";
import userRouter from "../../user/user.route";
import settingsRouter from "../../settings/settings.route";
import transactionRouter from "../../transaction/transaction.route";

const mainRouter: Router = express.Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/user", userRouter);
mainRouter.use("/setting", settingsRouter);
mainRouter.use("/transaction", transactionRouter);

export default mainRouter;
