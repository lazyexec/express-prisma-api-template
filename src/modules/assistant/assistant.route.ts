import { Router } from "express";
import assistantController from "./assistant.controller";

const router = Router();

router.post("/chat", assistantController.chat);

export default router;
