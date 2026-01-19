import { z } from "zod";
import validator from "../../utils/validation";

const updateProfile = {
  body: z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    avatar: z.string().optional(),
    fcmToken: z.string().nullable().optional(),
    phoneNumber: z.string().optional(),
    countryCode: z.string().optional(),
  }).superRefine((data: any, ctx: any) => {
    if (data.phoneNumber && !data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country code is required when phone number is provided",
        path: ["countryCode"],
      });
    }
    if (!data.phoneNumber && data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country code is forbidden when phone number is not provided",
        path: ["countryCode"],
      });
    }
  }),
};

const queryAllUsers = {
  query: z.object({
    page: z.coerce.number().default(1).optional(),
    limit: z.coerce.number().default(10).optional(),
    sort: z.string().default("createdAt desc").optional(),
    role: z.enum(["provider", "user"]).optional(),
    isDeleted: z.coerce.boolean().optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    countryCode: z.string().optional(),
  }).superRefine((data: any, ctx: any) => {
    if (data.phoneNumber && !data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country code is required when phone number is provided",
        path: ["countryCode"],
      });
    }
    if (!data.phoneNumber && data.countryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country code is forbidden when phone number is not provided",
        path: ["countryCode"],
      });
    }
  }),
};

const restrictUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string(),
  }),
};

const unrestrictUser = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

const getUserById = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

const addUser = {
  body: z.object({
    avatar: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    role: z.enum(["provider", "user"]),
    password: z.string().refine(validator.password, {
      message: "password must be at least 8 characters and contain at least 1 letter and 1 number",
    }),
  }),
};

export default {
  updateProfile,
  queryAllUsers,
  restrictUser,
  unrestrictUser,
  getUserById,
  addUser,
};
