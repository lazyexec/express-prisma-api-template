import express, { Router } from "express";
import authRouter from "../../auth/auth.route";
import userRouter from "../../user/user.route";
import settingsRouter from "../../settings/settings.route";
import transactionRouter from "../../transaction/transaction.route";
import tokenRouter from "../../token/token.route";
import assistantRouter from "../../assistant/assistant.route";

const mainRouter: Router = express.Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/token", tokenRouter);
mainRouter.use("/user", userRouter);
mainRouter.use("/setting", settingsRouter);
mainRouter.use("/transaction", transactionRouter);
mainRouter.use("/assistant", assistantRouter);

export default mainRouter;
