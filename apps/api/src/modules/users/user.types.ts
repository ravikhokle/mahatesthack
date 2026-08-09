export const USER_ROLES = ['student', 'content_manager', 'super_admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
