export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'content_manager' | 'super_admin';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  verificationLink?: string;
};

export type MessageResponse = {
  message: string;
  verificationLink?: string;
};

export type ProfileResponse = {
  user: AuthUser;
};
