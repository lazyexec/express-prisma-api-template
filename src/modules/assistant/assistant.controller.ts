import AIHelper from "../../libs/ai";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import variables from "../../configs/variables";

const chat = catchAsync(async (req: Request, res: Response) => {
  const message = req.body.message;
  //   const { userId, sessionId, message } = req.body;
  const aiHelper = new AIHelper({
    provider: "gemini",
    model: "gemini-2.5-flash",
    geminiKey: variables.GEMINI_API_KEY,
    streaming: false,
  });

  const response = await aiHelper.chat({
    userId: "user_123",
    sessionId: "session_456",
    message: message ? message : "Hello!",
  });
  res.json(response);
});

export default {
  chat,
};
