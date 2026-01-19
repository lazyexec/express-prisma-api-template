import express from "express";
import stripeController from "./stripe.controller";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  stripeController.webhook
);

export default router;
