import express from "express";
import userController from "./user.controller";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import userValidation from "./user.validation";
import userFileUploadMiddleware from "../../middlewares/fileUploader";
const uploadAll = userFileUploadMiddleware("./public/uploads/all").fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 2 },
]);

const router = express.Router();

router.route("/self/in").get(auth("common"), userController.getProfile);

router
  .route("/self/update")
  .patch(
    auth("common"),
    uploadAll,
    validate(userValidation.updateProfile),
    userController.updateProfile
  );

router.get(
  "/all",
  auth("provider"),
  validate(userValidation.queryAllUsers),
  userController.queryAllUsers
);

router
  .route("/:userId")
  .get(
    auth("common"),
    validate(userValidation.getUserById),
    userController.getProfileById
  );

router
  .route("/restrict/:userId")
  .post(
    auth("provider"),
    validate(userValidation.restrictUser),
    userController.restrictUser
  );

router
  .route("/unrestrict/:userId")
  .post(
    auth("provider"),
    validate(userValidation.unrestrictUser),
    userController.unrestrictUser
  );

router
  .route("/create")
  .post(
    auth("provider"),
    uploadAll,
    validate(userValidation.addUser),
    userController.addUser
  );

router
  .route("/delete/:userId")
  .delete(
    auth("provider"),
    validate(userValidation.getUserById),
    userController.deleteUser
  );
router
  .route("/recover/:userId")
  .post(
    auth("provider"),
    validate(userValidation.getUserById),
    userController.recoverUser
  );

export default router;
