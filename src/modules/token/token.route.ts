import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import tokenController from "./token.controller";
import tokenValidation from "./token.validation";
const router = express.Router();

// THIS ROUTE ONLY CLOSED FOR ADMIN USERS
router.get(
  "/sessions/all",
  auth("admin"),
  validate(tokenValidation.querySessions),
  tokenController.querySessions,
);

router.delete(
  "/sessions/revoke/:userId/:tokenId",
  auth("admin"),
  validate(tokenValidation.querySessions),
  tokenController.revokeSession,
);

export default router;
