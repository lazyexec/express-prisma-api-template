// types/token.types.ts

import { tokenType } from "../../../generated/prisma/enums";


export interface IToken {
  id?: string;
  userId: string;
  token?: string;
  type?: tokenType;
  expiresAt?: Date;
  createdAt?: Date;
  lastUsedAt?: Date;
  deviceId?: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked?: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  tokenFamily?: string;
  replacesTokenId?: string;
  useCount?: number;
  sessionId?: string;
  rememberMe?: boolean;
  metadata?: any;
}