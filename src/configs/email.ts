import env from "./variables";
import logger from "../utils/logger";
import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import emailTemplates from "./emailTemplates";

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport(env.email.provider);

transporter
  .verify()
  .then(() => {
    logger.info("SMTP transporter is Ready for Usage!");
  })
  .catch((err) => {
    // logger.error("SMTP transporter failed to connect with error:", err);
    logger.error("SMTP transporter failed to connect");
  });

const sendMail = async (options: nodemailer.SendMailOptions) => {
  if (env.DEBUG) {
    return;
  }
  try {
    await transporter.sendMail({
      from: env.email.from,
      ...options,
    });
  } catch (error: any) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const sendRegistrationEmail = async (to: string, token: string) => {
  logger.info(`Sending registration email to ${to} with token ${token}`);
  const template = emailTemplates.registration(token);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const template = emailTemplates.resetPassword(token);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(`Sending reset password email to ${to} with token ${token}`);
};

const sendRestrictionEmail = async (to: string, reason: string) => {
  const template = emailTemplates.restriction(reason);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(`Sending restriction email to ${to}`);
};

const sendUnrestrictedEmail = async (to: string) => {
  const template = emailTemplates.unrestricted();
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(`Sending unrestricted email to ${to}`);
};

const sendWelcomeEmail = async (to: string, token: string) => {
  const template = emailTemplates.welcome(token);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(`Sending welcome email to ${to} with token ${token}`);
};

const sendAssessmentEmail = async (
  to: string,
  assessmentTitle: string,
  shareUrl: string,
  customMessage?: string
) => {
  const template = emailTemplates.assessment(assessmentTitle, shareUrl, customMessage);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(
    `Sending assessment email to ${to} for assessment: ${assessmentTitle}`
  );
};

const sendPaymentLinkEmail = async (
  to: string,
  paymentLink: string,
  appointmentDetails: any
) => {
  const template = emailTemplates.paymentLink(paymentLink, appointmentDetails);
  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  logger.info(`Sending payment link email to ${to}`);
};

export default {
  sendRegistrationEmail,
  sendResetPasswordEmail,
  sendRestrictionEmail,
  sendUnrestrictedEmail,
  sendWelcomeEmail,
  sendAssessmentEmail,
  sendPaymentLinkEmail,
};
