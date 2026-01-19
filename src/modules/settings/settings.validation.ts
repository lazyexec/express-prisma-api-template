import { z } from "zod";

const settingsContent = {
  body: z.object({
    content: z.string().min(10).max(5000),
  }),
};

const faqValidation = {
  body: z.object({
    faqs: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ),
  }),
};

export const settingsValidation = {
  settingsContent,
  faqValidation,
};
