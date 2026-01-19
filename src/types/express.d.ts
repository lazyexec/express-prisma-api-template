import { IUser } from "../modules/user/user.interface";

export interface DeviceInfo {
  // Basic info
  userAgent: string;
  ip: string | undefined;

  // Request details
  host: string | null;
  port: string | null;
  origin: string | null;
  referer: string | null;
  protocol: string;
  method: string;
  path: string;

  // Locale
  acceptLanguage: string | null;
  timezone?: string;

  // Device detection
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceName: string; // Human-readable name like "Chrome on Windows"

  // Security
  deviceId?: string; // Unique device identifier from client
  fingerprint: string; // Server-side fingerprint hash
  isTrusted: boolean; // Based on known patterns
  isBot: boolean;

  // Additional headers (for security analysis)
  headers: {
    xForwardedFor?: string;
    xRealIp?: string;
    cfConnectingIp?: string; // Cloudflare
    xClientIp?: string;
    forwarded?: string;
  };
}

declare global {
  namespace Express {
    interface User extends IUser {
      id?: string;
      role?: string;
      name?: string;
      fcmToken?: string;
    }

    interface Request {
      device?: DeviceInfo;
      rawBody?: string;
      language?: string;
      str: (
        key: import("../utils/i18n").I18nKey,
        params?: Record<string, string | number>,
      ) => string;
    }
  }
}
