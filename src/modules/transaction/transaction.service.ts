import prisma from "../../configs/prisma";
import ApiError from "../../utils/ApiError";
import httpStatus from "http-status";

interface ICreateTransaction {
  sessionId?: string;
  clientId?: string;
  clinicId?: string;
  userId?: string;
  transactionId?: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  description?: string;
  meta?: Record<string, any>;
}

/**
 * Create a transaction record
 */
const createTransaction = async (data: ICreateTransaction) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        sessionId: data.sessionId,
        clientId: data.clientId,
        clinicId: data.clinicId,
        userId: data.userId,
        transactionId: data.transactionId,
        amount: data.amount,
        type: data.type,
        method: data.method,
        status: data.status,
        description: data.description,
        meta: data.meta || {},
      },
    });

    return transaction;
  } catch (error) {
    console.error("Failed to create transaction:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create transaction record"
    );
  }
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (id: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found");
  }

  return transaction;
};

/**
 * Get transactions by clinic ID
 */
const getTransactionsByClinicId = async (clinicId: string, options: any = {}) => {
  const { limit = 50, page = 1, type, status } = options;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { clinicId };
  if (type) where.type = type;
  if (status) where.status = status;

  const [transactions, totalDocs] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    docs: transactions,
    totalDocs,
    limit: take,
    page: Number(page),
    totalPages: Math.ceil(totalDocs / take),
  };
};

/**
 * Get transactions by user ID
 */
const getTransactionsByUserId = async (userId: string, options: any = {}) => {
  const { limit = 50, page = 1, type, status } = options;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { userId };
  if (type) where.type = type;
  if (status) where.status = status;

  const [transactions, totalDocs] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    docs: transactions,
    totalDocs,
    limit: take,
    page: Number(page),
    totalPages: Math.ceil(totalDocs / take),
  };
};

/**
 * Update transaction status
 */
const updateTransactionStatus = async (
  id: string,
  status: string,
  meta?: Record<string, any>
) => {
  const updateData: any = { status };
  if (meta) {
    updateData.meta = meta;
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
  });

  return transaction;
};

/**
 * Get transaction by Stripe session ID
 */
const getTransactionByStripeSessionId = async (stripeSessionId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      transactionId: stripeSessionId,
    },
  });

  return transaction;
};

/**
 * Get all transactions (for admin/provider)
 */
const getAllTransactions = async (filter: any = {}, options: any = {}) => {
  const { limit = 50, page = 1, sort = { createdAt: "desc" } } = options;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (filter.type) where.type = filter.type;
  if (filter.status) where.status = filter.status;
  if (filter.clinicId) where.clinicId = filter.clinicId;
  if (filter.userId) where.userId = filter.userId;

  const [transactions, totalDocs] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take,
      skip,
      orderBy: sort,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    docs: transactions,
    totalDocs,
    limit: take,
    page: Number(page),
    totalPages: Math.ceil(totalDocs / take),
  };
};

/**
 * Get transaction (alias for getTransactionById)
 */
const getTransaction = async (id: string) => {
  return getTransactionById(id);
};

/**
 * Delete transaction
 */
const deleteTransaction = async (id: string) => {
  const transaction = await prisma.transaction.delete({
    where: { id },
  });

  return transaction;
};

export default {
  createTransaction,
  getTransactionById,
  getTransaction,
  getTransactionsByClinicId,
  getTransactionsByUserId,
  updateTransactionStatus,
  getTransactionByStripeSessionId,
  getAllTransactions,
  deleteTransaction,
};
