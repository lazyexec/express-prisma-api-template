import stripeConfig from "../../configs/stripe";
import prisma from "../../configs/prisma";
import logger from "../../utils/logger";
import ApiError from "../../utils/ApiError";
import httpStatus from "http-status";

const processWebHookStripe = async (event: any) => {
  switch (event.type) {
    // Checkout session completed
    case "checkout.session.completed": {
      const session = event.data.object;

      // Add your checkout completion logic here
      logger.info(`Checkout session completed: ${session.id}`);

      break;
    }

    // Payment intent succeeded
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      // Add your payment success logic here
      logger.info(`Payment intent succeeded: ${paymentIntent.id}`);

      break;
    }

    // Charge refunded
    case "charge.refunded": {
      const charge = event.data.object;

      // Add your refund logic here
      logger.info(`Charge refunded: ${charge.id}`);

      break;
    }

    // Payment failed
    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed": {
      const payment = event.data.object;

      // Add your payment failure logic here
      logger.info(`Payment failed: ${payment.id}`);

      break;
    }

    // Subscription created
    case "customer.subscription.created": {
      const subscription = event.data.object;

      // Add your subscription creation logic here
      logger.info(`Subscription created: ${subscription.id}`);

      break;
    }

    // Subscription updated
    case "customer.subscription.updated": {
      const subscription = event.data.object;

      // Add your subscription update logic here
      logger.info(`Subscription updated: ${subscription.id}`);

      break;
    }

    // Subscription deleted
    case "customer.subscription.deleted": {
      const subscription = event.data.object;

      // Add your subscription cancellation logic here
      logger.info(`Subscription deleted: ${subscription.id}`);

      break;
    }

    // Invoice payment succeeded
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;

      // Add your invoice payment success logic here
      logger.info(`Invoice payment succeeded: ${invoice.id}`);

      break;
    }

    // Invoice payment failed
    case "invoice.payment_failed": {
      const invoice = event.data.object;

      // Add your invoice payment failure logic here
      logger.info(`Invoice payment failed: ${invoice.id}`);

      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }
};

// Create a Stripe customer
const createCustomer = async (data: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}) => {
  try {
    const customer = await stripeConfig.createCustomer({
      email: data.email,
      name: data.name,
      metadata: data.metadata,
    });

    return customer;
  } catch (error) {
    logger.error("Stripe customer creation failed:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to create Stripe customer"
    );
  }
};

// Create a subscription
const createSubscription = async (data: {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}) => {
  try {
    const subscription = await stripeConfig.createSubscription({
      customerId: data.customerId,
      priceId: data.priceId,
      trialPeriodDays: data.trialPeriodDays,
      metadata: data.metadata,
    });

    return subscription;
  } catch (error) {
    logger.error("Stripe subscription creation failed:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to create Stripe subscription"
    );
  }
};

// Cancel a subscription
const cancelSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripeConfig.cancelSubscription(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error("Stripe subscription cancellation failed:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to cancel Stripe subscription"
    );
  }
};

// Get subscription details
const getSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripeConfig.getSubscription(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error("Stripe subscription retrieval failed:", error);
    throw new ApiError(httpStatus.NOT_FOUND, "Stripe subscription not found");
  }
};

// Create a payment intent
const createPaymentIntent = async (data: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) => {
  try {
    const paymentIntent = await stripeConfig.createPaymentIntent({
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
      customerId: data.customerId,
    });

    return paymentIntent;
  } catch (error) {
    logger.error("Stripe payment intent creation failed:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to create payment intent"
    );
  }
};

// Retrieve a payment intent
const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripeConfig.getPaymentIntent(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error("Stripe payment intent retrieval failed:", error);
    throw new ApiError(httpStatus.NOT_FOUND, "Payment intent not found");
  }
};

// Confirm a payment intent
const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId?: string
) => {
  try {
    const paymentIntent = await stripeConfig.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId
    );
    return paymentIntent;
  } catch (error) {
    logger.error("Stripe payment intent confirmation failed:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to confirm payment intent"
    );
  }
};

export default {
  processWebHookStripe,
  createCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
};
