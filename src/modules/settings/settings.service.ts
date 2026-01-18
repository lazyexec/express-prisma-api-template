import sanitizeHtml from "sanitize-html";
import prisma from "../../configs/prisma";
import { IFAQ, ISettingsContent } from "./settings.interface";

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "style",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "title", "width", "height", "loading"],
    a: ["href", "name", "target"],
    "*": ["style", "class"],
  },
};

const modifyTermsAndCondition = async (data: ISettingsContent) => {
  const sanitizedContent = sanitizeHtml(data.content, sanitizeOptions);
  
  return await prisma.setting.upsert({
    where: { type: "terms_and_conditions" },
    update: { content: sanitizedContent },
    create: { type: "terms_and_conditions", content: sanitizedContent },
  });
};

const modifyAboutUs = async (data: ISettingsContent) => {
  const sanitizedContent = sanitizeHtml(data.content, sanitizeOptions);
  
  return await prisma.setting.upsert({
    where: { type: "about_us" },
    update: { content: sanitizedContent },
    create: { type: "about_us", content: sanitizedContent },
  });
};

const modifyPrivacyPolicy = async (data: ISettingsContent) => {
  const sanitizedContent = sanitizeHtml(data.content, sanitizeOptions);
  
  return await prisma.setting.upsert({
    where: { type: "privacy_policy" },
    update: { content: sanitizedContent },
    create: { type: "privacy_policy", content: sanitizedContent },
  });
};

const modifyFAQ = async (data: { faqs: IFAQ[] }) => {
  const sanitizedFaqs = data.faqs.map((faq, index) => ({
    question: sanitizeHtml(faq.question, sanitizeOptions),
    answer: sanitizeHtml(faq.answer, sanitizeOptions),
    order: index,
  }));

  // Delete all existing FAQs and create new ones
  await prisma.fAQ.deleteMany();
  
  return await prisma.fAQ.createMany({
    data: sanitizedFaqs,
  });
};

const getTermsAndCondition = async () => {
  return await prisma.setting.findUnique({
    where: { type: "terms_and_conditions" },
  });
};

const getAboutUs = async () => {
  return await prisma.setting.findUnique({
    where: { type: "about_us" },
  });
};

const getPrivacyPolicy = async () => {
  return await prisma.setting.findUnique({
    where: { type: "privacy_policy" },
  });
};

const getFAQ = async () => {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { order: "asc" },
  });
  
  return { faqs };
};

export const settingsService = {
  modifyTermsAndCondition,
  modifyAboutUs,
  modifyPrivacyPolicy,
  modifyFAQ,
  getTermsAndCondition,
  getAboutUs,
  getPrivacyPolicy,
  getFAQ,
};
