import express, { Router } from "express";
import authController from "./auth.controller";
import validate from "../../middlewares/validate";
import authValidation from "./auth.validation";
import auth from "../../middlewares/auth";
import userFileUploadMiddleware from "../../middlewares/fileUploader";
const uploadAll = userFileUploadMiddleware("./public/uploads/all").fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 2 },
]);

const router: Router = express.Router();

router.post(
  "/register",
  uploadAll,
  validate(authValidation.register),
  authController.register,
);
router.post("/login", validate(authValidation.login), authController.login);
router.post(
  "/verify-account",
  validate(authValidation.verifyAccount),
  authController.verifyAccount,
);
router.post("/logout", validate(authValidation.logout), authController.logout);
router.post(
  "/refresh-tokens",
  validate(authValidation.refreshTokens),
  authController.refreshTokens,
);
router.post(
  "/forgot-password",
  validate(authValidation.forgotPassword),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword,
);
router.post(
  "/change-password",
  auth("common"),
  validate(authValidation.changePassword),
  authController.changePassword,
);

router.post(
  "/req-verify-account",
  auth("common"),
  authController.reqVerifyAccount,
);

router.post(
  "/resend-otp",
  validate(authValidation.resendOtp),
  authController.resendOtp,
);

router.post(
  "/oauth/:provider",
  validate(authValidation.oauth),
  authController.oauth,
);

router.get(
  "/oauth/callback/:provider",
  validate(authValidation.oauthCallback),
  authController.oauthCallback,
);

router.post(
  "/mobile/oauth",
  validate(authValidation.loginWithOAuth),
  authController.loginWithOAuth,
);

router.delete("/delete-me", auth("common"), authController.deleteAccount);
export default router;
