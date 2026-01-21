import { z } from "zod";

const querySessions = {
  params: z.object({
    email: z.string().email().optional(),
    type: z.enum(["ACCESS", "REFRESH"]).optional(),
    sort: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional(),
  }),
};

const revokeSession = {
  params: z.object({
    userId: z.string().uuid(),
    tokenId: z.string().uuid(),
  }),
};

export default { querySessions, revokeSession };
