import catchAsync from "../../utils/catchAsync";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import response from "../../utils/response";
import stripeConfig from "../../configs/stripe";
import ApiError from "../../utils/ApiError";
import stripeService from "./stripe.service";

const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing stripe-signature header"
    );
  }

  let event;
  try {
    // Verify webhook signature
    event = stripeConfig.verifyWebhook(req.body, signature);

    // Log the event for debugging
    console.log(`Received Stripe webhook: ${event.type}`);

    // Check if this is a Connect event (has account property)
    if (event.account) {
      console.log(`Event from connected account: ${event.account}`);
    }
  } catch (err: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  await stripeService.processWebHookStripe(event);

  res.status(httpStatus.OK).json(
    response({
      status: httpStatus.OK,
      message: "Webhook processed successfully",
    })
  );
});

export default {
  webhook,
};
