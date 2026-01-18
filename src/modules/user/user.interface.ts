export interface IUser {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  avatar?: string;
  password?: string | null;
  role: any;
  fcmToken?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  oneTimeCode?: string | null;
  oneTimeCodeExpires?: Date | null;
  isDeleted?: boolean;
  isEmailVerified?: boolean;
  isResetPassword?: boolean;
  isRestricted?: boolean;
  restrictionReason?: string | null;
  // Business fields
  bio?: string | null;
  // Timestamps
  isOnline?: boolean;
  lastSeen?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
