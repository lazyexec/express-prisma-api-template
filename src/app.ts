import env from "./configs/variables";
import express, { type Application } from "express";
import v1Router from "./modules/routes/v1/index";
import { errorConverter, errorHandler } from "./middlewares/globalErrorHandler";
import compression from "compression";
import helmet from "helmet";
import "./configs/passport";
import passport from "passport";
import deviceMiddleware from "./middlewares/device";
import i18nMiddleware from "./middlewares/i18nMiddleware";
import webhookRouter from "./modules/stripe/stripe.route";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./docs/swagger";
import cookieParser from "cookie-parser";

const app: Application = express();
// Rate Limiter
if (!env.DEBUG) {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
    }),
  );
}
// For Exporting Public Files to User
app.use("/public", express.static(path.join(__dirname, "../public")));
// Morgan Logger for logging requests
if (env.DEBUG) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}
// Enable CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
// Webhook Route for raw body
app.use("/api/v1/webhook", webhookRouter);
// parse json request body
app.use(express.json({ limit: "50mb" }));
// Set security HTTP headers
app.use(helmet());
// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// // gzip compression
app.use(deviceMiddleware);
app.use(i18nMiddleware);
app.use(compression());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/v1", v1Router);

app.use(errorConverter);
app.use(errorHandler);
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "./docs/index.html"));
});

export default app;
