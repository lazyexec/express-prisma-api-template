import { configDotenv } from "dotenv";
import Joi from "joi";
configDotenv();

const validator = Joi.object()
  .keys({
    APP_NAME: Joi.string()
      .default("express-prisma-api-template")
      .description("Application name"),
    PORT: Joi.number().default(3000),
    BACKEND_IP: Joi.string().default("localhost"),
    SOCKET_PORT: Joi.number().default(3001), // This is for only testing purpose (Development)
    DATABASE_URL: Joi.string().optional(),
    NODE_ENV: Joi.string()
      .valid("development", "production")
      .default("development"),
    JWT_SECRET: Joi.string().required().description("JWT Secret key"),
    JWT_ACCESS_EXPIRY: Joi.string()
      .default("3d")
      .description("JWT Access Expiry time"),
    JWT_REFRESH_EXPIRY: Joi.string()
      .default("30d")
      .description("JWT Refresh Expiry time"),
    SMTP_HOST: Joi.string().required().description("SMTP Host"),
    SMTP_PORT: Joi.number().required().description("SMTP Port"),
    SMTP_USERNAME: Joi.string().required().description("SMTP Username"),
    SMTP_PASSWORD: Joi.string().required().description("SMTP Password"),
    EMAIL_FROM: Joi.string()
      .email()
      .required()
      .description("Email From Address"),
    STRIPE_SECRET_KEY: Joi.string().required().description("Stripe Secret Key"),
    STRIPE_WEBHOOK_SECRET: Joi.string()
      .required()
      .description("Stripe Webhook Secret Key"),
    // URLS
    FRONTEND_URL: Joi.string().default("*").description("Frontend URL"),
    BACKEND_URL: Joi.string()
      .default(`http://${process.env.BACKEND_IP}:${process.env.PORT}`)
      .description("Frontend URL"),
    FIREBASE_PROJECT_ID: Joi.string()
      .required()
      .description("Firebase project Id"),
    FIREBASE_PRIVATE_KEY: Joi.string()
      .required()
      .description("Firebase Private Key"),
    FIREBASE_CLIENT_EMAIL: Joi.string()
      .required()
      .description("Firebase Client Email"),
    GOOGLE_CLIENT_ID: Joi.string().required().description("Google Client ID"),
    GOOGLE_CLIENT_SECRET: Joi.string()
      .required()
      .description("Google Client Secret"),
    // Zoom Integration
    ZOOM_ACCOUNT_ID: Joi.string().optional().description("Zoom Account ID"),
    ZOOM_CLIENT_ID: Joi.string().optional().description("Zoom Client ID"),
    ZOOM_CLIENT_SECRET: Joi.string()
      .optional()
      .description("Zoom Client Secret"),
    // Xero Integration
    XERO_CLIENT_ID: Joi.string().optional().description("Xero Client ID"),
    XERO_CLIENT_SECRET: Joi.string()
      .optional()
      .description("Xero Client Secret"),
    XERO_REDIRECT_URI: Joi.string().optional().description("Xero Redirect URI"),
    // Mailchimp Integration
    MAILCHIMP_API_KEY: Joi.string().optional().description("Mailchimp API Key"),
    MAILCHIMP_SERVER_PREFIX: Joi.string()
      .optional()
      .description("Mailchimp Server Prefix"),
    // Stripe Connect OAuth
    STRIPE_CONNECT_CLIENT_ID: Joi.string()
      .required()
      .description("Stripe Connect Client ID"),
    // Mailchimp OAuth
    MAILCHIMP_CLIENT_ID: Joi.string()
      .optional()
      .description("Mailchimp OAuth Client ID"),
    MAILCHIMP_CLIENT_SECRET: Joi.string()
      .optional()
      .description("Mailchimp OAuth Client Secret"),
  })
  .unknown();

const { value, error } = validator.validate(process.env);

if (error) throw new Error(error.message);

const env = {
  APP_NAME: value.APP_NAME,
  PORT: value.PORT,
  BACKEND_IP: value.BACKEND_IP,
  SOCKET_PORT: value.SOCKET_PORT,
  DATABASE_URL: value.DATABASE_URL,
  ENVIRONMENT: value.NODE_ENV,
  DEBUG: value.NODE_ENV === "development",
  jwt: {
    secret: value.JWT_SECRET,
    expiryAccessToken: value.JWT_ACCESS_EXPIRY,
    expiryRefreshToken: value.JWT_REFRESH_EXPIRY,
    issuer: value.APP_NAME,
    audience: value.APP_NAME,
  },
  email: {
    provider: {
      host: value.SMTP_HOST,
      port: value.SMTP_PORT,
      pool: true,
      secure: value.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: value.SMTP_USERNAME,
        pass: value.SMTP_PASSWORD,
      },
    },
    from: value.EMAIL_FROM,
  },

  // URLS
  FRONTEND_URL: value.FRONTEND_URL,
  BACKEND_URL: value.BACKEND_URL,
  // Firebase Config
  firebase: {
    projectId: value.FIREBASE_PROJECT_ID || "",
    clientEmail: value.FIREBASE_CLIENT_EMAIL || "",
    privateKey: value.FIREBASE_PRIVATE_KEY
      ? value.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  },

  // Integration Services
  zoom: {
    accountId: value.ZOOM_ACCOUNT_ID,
    clientId: value.ZOOM_CLIENT_ID,
    clientSecret: value.ZOOM_CLIENT_SECRET,
  },
  xero: {
    clientId: value.XERO_CLIENT_ID,
    clientSecret: value.XERO_CLIENT_SECRET,
    redirectUri: value.XERO_REDIRECT_URI,
  },
  mailchimp: {
    apiKey: value.MAILCHIMP_API_KEY,
    serverPrefix: value.MAILCHIMP_SERVER_PREFIX,
    oauth: {
      clientId: value.MAILCHIMP_CLIENT_ID,
      clientSecret: value.MAILCHIMP_CLIENT_SECRET,
    },
  },
  stripe: {
    secretKey: value.STRIPE_SECRET_KEY,
    webhookSecret: value.STRIPE_WEBHOOK_SECRET,
  },
  stripeConnect: {
    clientId: value.STRIPE_CONNECT_CLIENT_ID,
  },
  google: {
    clientId: value.GOOGLE_CLIENT_ID,
    clientSecret: value.GOOGLE_CLIENT_SECRET,
    redirectUri:
      value.BACKEND_URL + "/api/v1/integration/oauth/callback/google_calendar",
  },
};
export default env;
