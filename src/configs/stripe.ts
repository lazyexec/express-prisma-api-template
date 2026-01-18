import Stripe from "stripe";
import env from "./variables";

// Initialize Stripe with API version
const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Create a Stripe Checkout Session for one-time payments
 */
const createCheckoutSession = async ({
  priceId,
  quantity,
  successUrl,
  cancelUrl,
  metadata = {},
  applicationFeeAmount,
  transferDestination,
}: {
  priceId: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  applicationFeeAmount?: number;
  transferDestination?: string;
}) => {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  };

  if (applicationFeeAmount && transferDestination) {
    sessionConfig.payment_intent_data = {
      application_fee_amount: Math.round(applicationFeeAmount * 100),
      transfer_data: {
        destination: transferDestination,
      },
    };
  }

  return await stripe.checkout.sessions.create(sessionConfig);
};

/**
 * Create a Stripe Checkout Session with custom price data
 */
const createCheckoutSessionWithPrice = async ({
  name,
  amount,
  currency = "usd",
  metadata = {},
  successUrl,
  cancelUrl,
}: {
  name: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}) => {
  return await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: { name },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl || `${env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${env.FRONTEND_URL}/payment/cancel`,
    metadata,
  });
};

/**
 * Create a Stripe Checkout Session for subscriptions
 */
const createSubscriptionCheckout = async ({
  planName,
  planDescription,
  amount,
  currency = "usd",
  interval = "month",
  metadata = {},
  subscriptionMetadata = {},
  successUrl,
  cancelUrl,
  customerEmail,
}: {
  planName: string;
  planDescription?: string;
  amount: number;
  currency?: string;
  interval?: "day" | "week" | "month" | "year";
  metadata?: Record<string, string>;
  subscriptionMetadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) => {
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: planName,
            description: planDescription,
          },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata,
    subscription_data: {
      metadata: subscriptionMetadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
  });
};

/**
 * Create a Payment Intent (for custom payment flows)
 */
const createPaymentIntent = async ({
  amount,
  currency = "usd",
  metadata = {},
  customerId,
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

/**
 * Retrieve a Payment Intent
 */
const getPaymentIntent = async (paymentIntentId: string) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Confirm a Payment Intent
 */
const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId?: string
) => {
  return await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
};

/**
 * Create a Stripe Customer
 */
const createCustomer = async ({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}) => {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
};

/**
 * Create a Subscription
 */
const createSubscription = async ({
  customerId,
  priceId,
  trialPeriodDays,
  metadata = {},
}: {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialPeriodDays,
    metadata,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
};

/**
 * Get a Subscription
 */
const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

/**
 * Cancel a Subscription
 */
const cancelSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.cancel(subscriptionId);
};

/**
 * Update a Subscription
 */
const updateSubscription = async (
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
) => {
  return await stripe.subscriptions.update(subscriptionId, params);
};

/**
 * Issue a Refund
 */
const refundPayment = async (paymentIntentId: string, amount?: number) => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
};

/**
 * Create a Transfer (for Stripe Connect)
 */
const createTransfer = async ({
  amount,
  currency = "usd",
  destination,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  destination: string;
  metadata?: Record<string, string>;
}) => {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
    metadata,
  });
};

/**
 * Create a Connected Account (for Stripe Connect)
 */
const createConnectedAccount = async ({
  country,
  email,
  type = "express",
}: {
  country: string;
  email: string;
  type?: "express" | "standard" | "custom";
}) => {
  return await stripe.accounts.create({
    email,
    type,
    country,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        schedule: {
          interval: "manual",
        },
      },
    },
  });
};

/**
 * Create an Account Onboarding Link (for Stripe Connect)
 */
const createAccountLink = async ({
  accountId,
  refreshUrl,
  returnUrl,
  type = "account_onboarding",
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: "account_onboarding" | "account_update";
}) => {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
  });
};

/**
 * Verify Stripe Webhook Signature
 */
const verifyWebhook = (
  payload: string | Buffer,
  signature: string,
  secret?: string
) => {
  // console.log(`Webhook log is, our payload is ${payload}, and our signature is ${signature} and also secret can be ${secret || env.STRIPE_WEBHOOK_SECRET}`)
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    secret || env.stripe.webhookSecret
  );
};

/**
 * Retrieve a Checkout Session
 */
const getCheckoutSession = async (sessionId: string) => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};

export default {
  // Raw Stripe instance for advanced usage
  stripe,

  // Checkout Sessions
  createCheckoutSession,
  createCheckoutSessionWithPrice,
  createSubscriptionCheckout,
  getCheckoutSession,

  // Payment Intents
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,

  // Customers
  createCustomer,

  // Subscriptions
  createSubscription,
  getSubscription,
  cancelSubscription,
  updateSubscription,

  // Refunds
  refundPayment,

  // Stripe Connect
  createTransfer,
  createConnectedAccount,
  createAccountLink,

  // Webhooks
  verifyWebhook,
};
