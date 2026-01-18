import Joi from "joi";

const settingsContent = {
  body: Joi.object().keys({
    content: Joi.string().required().min(10).max(5000),
  }),
};

const faqValidation = {
  body: Joi.object().keys({
    faqs: Joi.array()
      .items(
        Joi.object().keys({
          question: Joi.string().required(),
          answer: Joi.string().required(),
        })
      )
      .required(),
  }),
};

export const settingsValidation = {
  settingsContent,
  faqValidation,
};
