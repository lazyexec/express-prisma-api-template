import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import { settingsController } from "./settings.controller";
import { settingsValidation } from "./settings.validation";

const router = express.Router();

router
  .route("/terms")
  .get(settingsController.getTermsAndCondition)
  .post(
    auth("admin"),
    validate(settingsValidation.settingsContent),
    settingsController.modifyTermsAndCondition
  );

router
  .route("/about")
  .get(settingsController.getAboutUs)
  .post(
    auth("admin"),
    validate(settingsValidation.settingsContent),
    settingsController.modifyAboutUs
  );

router
  .route("/privacy")
  .get(settingsController.getPrivacyPolicy)
  .post(
    auth("admin"),
    validate(settingsValidation.settingsContent),
    settingsController.modifyPrivacyPolicy
  );

router
  .route("/faq")
  .get(settingsController.getFAQ)
  .post(
    auth("admin"),
    validate(settingsValidation.faqValidation),
    settingsController.modifyFAQ
  );

export default router;
