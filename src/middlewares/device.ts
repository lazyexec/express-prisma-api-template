import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { DeviceInfo } from "../types/express";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

/*
SHOULD ALLOW BOT
*/

const SHOULD_ALLOW_BOT = true;

const deviceMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const userAgent = req.get("User-Agent") || "Unknown Device";
  const host = req.get("host") || null;
  const origin = req.get("origin") || null;
  const referer = req.get("referer") || null;
  const acceptLanguage = req.get("accept-language") || null;

  // Extract port from host
  let port: string | undefined = undefined;
  if (host && host.includes(":")) {
    port = host.split(":")[1];
  }

  // Get real IP (considering proxies)
  const ip = getRealIp(req);

  // Parse user agent for device details
  const parsedUA = parseUserAgent(userAgent);

  // Get device ID from custom header (if client sends it)
  const deviceId = req.get("X-Device-ID") || undefined;

  // Get timezone from custom header (if client sends it)
  const timezone = req.get("X-Timezone") || undefined;

  // Create device fingerprint
  const fingerprint = createDeviceFingerprint({
    userAgent,
    ip,
    acceptLanguage,
    deviceId,
  });

  // Check if device is trusted
  const isTrusted = checkIfTrusted(userAgent, ip);

  // Collect proxy headers
  const headers = {
    xForwardedFor: req.get("X-Forwarded-For"),
    xRealIp: req.get("X-Real-IP"),
    cfConnectingIp: req.get("CF-Connecting-IP"),
    xClientIp: req.get("X-Client-IP"),
    forwarded: req.get("Forwarded"),
  };

  req.device = {
    // Basic info
    userAgent,
    ip,

    // Request details
    host,
    port: port || null,
    origin,
    referer,
    protocol: req.protocol,
    method: req.method,
    path: req.originalUrl,

    // Locale
    acceptLanguage,
    timezone,

    // Device detection
    deviceType: parsedUA.deviceType,
    browser: parsedUA.browser,
    browserVersion: parsedUA.browserVersion,
    os: parsedUA.os,
    osVersion: parsedUA.osVersion,
    deviceName: parsedUA.deviceName,

    // Security
    deviceId,
    fingerprint,
    isTrusted,
    isBot: parsedUA.isBot,

    // Additional headers
    headers,
  };

  if (SHOULD_ALLOW_BOT && parsedUA.isBot) {
    next(new ApiError(httpStatus.FORBIDDEN, "Bots are not allowed"));
  }

  next();
};

/**
 * Get real IP address considering various proxy headers
 */
function getRealIp(req: Request): string | undefined {
  // Check common proxy headers in order of preference
  const cfConnectingIp = req.get("CF-Connecting-IP"); // Cloudflare
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = req.get("X-Real-IP");
  if (xRealIp) return xRealIp;

  const xForwardedFor = req.get("X-Forwarded-For");
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }

  const xClientIp = req.get("X-Client-IP");
  if (xClientIp) return xClientIp;

  // Fallback to Express's req.ip
  return req.ip;
}

/**
 * Parse User-Agent string to extract device information
 */
function parseUserAgent(userAgent: string): {
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceName: string;
  isBot: boolean;
} {
  const ua = userAgent.toLowerCase();

  // Detect bots
  const isBot = /bot|crawler|spider|scraper|curl|wget|python|java|http/i.test(
    userAgent,
  );

  // Detect device type
  let deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown" =
    "unknown";
  if (isBot) {
    deviceType = "bot";
  } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)
  ) {
    deviceType = "mobile";
  } else if (/windows|mac|linux/i.test(ua)) {
    deviceType = "desktop";
  }

  // Detect browser
  let browser = "Unknown";
  let browserVersion = "";

  if (ua.includes("edg/")) {
    browser = "Edge";
    browserVersion = extractVersion(ua, "edg/");
  } else if (ua.includes("chrome/") && !ua.includes("edg/")) {
    browser = "Chrome";
    browserVersion = extractVersion(ua, "chrome/");
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
    browserVersion = extractVersion(ua, "firefox/");
  } else if (ua.includes("safari/") && !ua.includes("chrome")) {
    browser = "Safari";
    browserVersion = extractVersion(ua, "version/");
  } else if (ua.includes("opera/") || ua.includes("opr/")) {
    browser = "Opera";
    browserVersion = extractVersion(
      ua,
      ua.includes("opr/") ? "opr/" : "opera/",
    );
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    browser = "Internet Explorer";
    browserVersion = extractVersion(ua, "msie") || extractVersion(ua, "rv:");
  }

  // Detect OS
  let os = "Unknown";
  let osVersion = "";

  if (ua.includes("windows")) {
    os = "Windows";
    if (ua.includes("windows nt 10.0")) osVersion = "10/11";
    else if (ua.includes("windows nt 6.3")) osVersion = "8.1";
    else if (ua.includes("windows nt 6.2")) osVersion = "8";
    else if (ua.includes("windows nt 6.1")) osVersion = "7";
  } else if (ua.includes("mac os x")) {
    os = "macOS";
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace("_", ".");
  } else if (ua.includes("android")) {
    os = "Android";
    const match = ua.match(/android (\d+\.?\d*)/);
    if (match) osVersion = match[1];
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = ua.includes("ipad") ? "iPadOS" : "iOS";
    const match = ua.match(/os (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace("_", ".");
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  const deviceName = createDeviceName(
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
  );

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceName,
    isBot,
  };
}

function extractVersion(ua: string, prefix: string): string {
  const regex = new RegExp(`${prefix}([\\d.]+)`, "i");
  const match = ua.match(regex);
  return match ? match[1].split(".").slice(0, 2).join(".") : "";
}

function createDeviceName(
  browser: string,
  browserVersion: string,
  os: string,
  osVersion: string,
  deviceType: string,
): string {
  if (deviceType === "bot") {
    return "Bot/Crawler";
  }

  const parts = [];

  if (browser !== "Unknown") {
    parts.push(browser);
    if (browserVersion) {
      parts.push(browserVersion);
    }
  }

  if (os !== "Unknown") {
    parts.push("on");
    parts.push(os);
    if (osVersion) {
      parts.push(osVersion);
    }
  }

  if (parts.length === 0) {
    return "Unknown Device";
  }

  return parts.join(" ");
}

function createDeviceFingerprint(data: {
  userAgent: string;
  ip: string | undefined;
  acceptLanguage: string | null;
  deviceId?: string;
}): string {
  const fingerprintData = [
    data.userAgent,
    data.ip || "",
    data.acceptLanguage || "",
    data.deviceId || "",
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(fingerprintData)
    .digest("hex")
    .substring(0, 32);
}

function checkIfTrusted(userAgent: string, ip: string | undefined): boolean {
  const trustedBots = [
    "googlebot",
    "bingbot",
    "slackbot",
    "twitterbot",
    "facebookexternalhit",
  ];

  const ua = userAgent.toLowerCase();
  const isTrustedBot = trustedBots.some((bot) => ua.includes(bot));
  return isTrustedBot;
}

export function getDeviceInfo(req: Request): DeviceInfo | undefined {
  return req.device;
}

export function getDeviceSummary(req: Request): string {
  const device = req.device;
  if (!device) return "Unknown Device";

  return `${device.deviceName} (${device.ip || "unknown IP"})`;
}

export default deviceMiddleware;
