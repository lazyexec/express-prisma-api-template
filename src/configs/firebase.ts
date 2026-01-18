import firebase from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import env from "./variables";
import logger from "../utils/logger";

let admin: any;

try {
  admin = initializeApp({
    credential: firebase.credential.cert(env.firebase),
  });
  logger.success("Firebase initialized successfully");
} catch (error: any) {
  logger.error("Failed to initialize Firebase: " + error.message);
  admin = null;
}

export default admin;
