import { z } from "zod";
import validator from "../../utils/validation";

const getAllTransactions = {
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    sort: z.string().default("createdAt:desc"),
  }),
};

const getClinicTransactions = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    type: z.string().optional(),
    status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
  }),
};

const getTransaction = {
  params: z.object({
    transactionId: z.string().refine(validator.objectId, {
      message: "must be a valid mongo id"
    }),
  }),
};

export default {
  getAllTransactions,
  getClinicTransactions,
  getTransaction,
};
