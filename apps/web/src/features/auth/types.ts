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
};

export type MessageResponse = {
  message: string;
};

export type ResendVerificationResponse = {
  message: string;
};

export type ProfileResponse = {
  user: AuthUser;
};
