import Joi from "joi";
import validator from "../../utils/validator";

const getAllTransactions = {
  query: Joi.object().keys({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    sort: Joi.string().default("createdAt:desc"),
  }),
};

const getClinicTransactions = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().optional(),
    status: Joi.string().valid("pending", "completed", "failed", "cancelled").optional(),
  }),
};

const getTransaction = {
  params: Joi.object().keys({
    transactionId: Joi.custom(validator.objectId).required(),
  }),
};

export default {
  getAllTransactions,
  getClinicTransactions,
  getTransaction,
};
