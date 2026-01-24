import { configDotenv } from "dotenv";
import { z } from "zod";
configDotenv();

const envSchema = z
  .object({
    APP_NAME: z
      .string()
      .default("express-prisma-api-template")
      .describe("Application name"),
    PORT: z.coerce.number().default(3000),
    BACKEND_IP: z.string().default("localhost"),
    SOCKET_PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().optional(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    JWT_SECRET: z.string().min(1).describe("JWT Secret key"),
    JWT_ACCESS_EXPIRY: z
      .string()
      .default("3d")
      .describe("JWT Access Expiry time"),
    JWT_REFRESH_EXPIRY: z
      .string()
      .default("30d")
      .describe("JWT Refresh Expiry time"),
    SMTP_HOST: z.string().min(1).describe("SMTP Host"),
    SMTP_PORT: z.coerce.number().describe("SMTP Port"),
    SMTP_USERNAME: z.string().min(1).describe("SMTP Username"),
    SMTP_PASSWORD: z.string().min(1).describe("SMTP Password"),
    EMAIL_FROM: z.string().email().optional().describe("Email From Address"),
    // URLS
    FRONTEND_URL: z.string().default("*").describe("Frontend URL"),
    BACKEND_URL: z.string().optional().describe("Backend URL"), // Will default below if not present, but Zod default is static.
    // We can handle dynamic default in the object construction or refine.
    FIREBASE_PROJECT_ID: z.string().optional().describe("Firebase project Id"),
    FIREBASE_PRIVATE_KEY: z
      .string()
      .optional()
      .describe("Firebase Private Key"),
    FIREBASE_CLIENT_EMAIL: z
      .string()
      .optional()
      .describe("Firebase Client Email"),
    GOOGLE_CLIENT_ID: z.string().optional().describe("Google Client ID"),
    GOOGLE_CLIENT_SECRET: z
      .string()
      .optional()
      .describe("Google Client Secret"),
    // Zoom Integration
    ZOOM_ACCOUNT_ID: z.string().optional().describe("Zoom Account ID"),
    ZOOM_CLIENT_ID: z.string().optional().describe("Zoom Client ID"),
    ZOOM_CLIENT_SECRET: z.string().optional().describe("Zoom Client Secret"),
    // Xero Integration
    XERO_CLIENT_ID: z.string().optional().describe("Xero Client ID"),
    XERO_CLIENT_SECRET: z.string().optional().describe("Xero Client Secret"),
    XERO_REDIRECT_URI: z.string().optional().describe("Xero Redirect URI"),
    // Mailchimp Integration
    MAILCHIMP_API_KEY: z.string().optional().describe("Mailchimp API Key"),
    MAILCHIMP_SERVER_PREFIX: z
      .string()
      .optional()
      .describe("Mailchimp Server Prefix"),
    // Stripe Connect OAuth
    STRIPE_SECRET_KEY: z.string().optional().describe("Stripe Secret Key"),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .optional()
      .describe("Stripe Webhook Secret Key"),
    STRIPE_CONNECT_CLIENT_ID: z
      .string()
      .optional()
      .describe("Stripe Connect Client ID"),
    // Mailchimp OAuth
    MAILCHIMP_CLIENT_ID: z
      .string()
      .optional()
      .describe("Mailchimp OAuth Client ID"),
    MAILCHIMP_CLIENT_SECRET: z
      .string()
      .optional()
      .describe("Mailchimp OAuth Client Secret"),
    IS_MULTI_LANGUAGE: z.coerce
      .boolean()
      .default(false)
      .describe("Is Multi Language"),
    // Apple OAuth - Updated fields
    APPLE_CLIENT_ID: z
      .string()
      .optional()
      .describe("Apple Client ID (Service ID)"),
    APPLE_TEAM_ID: z.string().optional().describe("Apple Team ID"),
    APPLE_KEY_ID: z.string().optional().describe("Apple Key ID"),
    APPLE_PRIVATE_KEY: z.string().optional().describe("Apple Private Key"),
    GEMINI_API_KEY: z.string().optional().describe("Gemini API Key"),
  })
  .passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessage = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join(", ");
  throw new Error(`Config validation error: ${errorMessage}`);
}

const value = parsed.data;

const backendUrl =
  value.BACKEND_URL || `http://${value.BACKEND_IP}:${value.PORT}`;

const env = {
  APP_NAME: value.APP_NAME,
  PORT: value.PORT,
  BACKEND_IP: value.BACKEND_IP,
  SOCKET_PORT: value.SOCKET_PORT,
  DATABASE_URL: value.DATABASE_URL,
  ENVIRONMENT: value.NODE_ENV,
  DEBUG: value.NODE_ENV === "development",
  IS_MULTI_LANGUAGE: value.IS_MULTI_LANGUAGE,
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
  BACKEND_URL: backendUrl,
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
    callbackUrl: backendUrl + "/api/v1/auth/oauth/callback/google",
  },
  apple: {
    clientId: value.APPLE_CLIENT_ID,
    teamId: value.APPLE_TEAM_ID,
    keyId: value.APPLE_KEY_ID,
    privateKey: value.APPLE_PRIVATE_KEY
      ? value.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
    callbackUrl: backendUrl + "/api/v1/auth/oauth/callback/apple",
  },
  GEMINI_API_KEY: value.GEMINI_API_KEY,
};
export default env;
