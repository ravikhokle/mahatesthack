import { apiRequest } from '@/lib/api';

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from './schemas';
import type { AuthResponse, MessageResponse, ProfileResponse } from './types';

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function refreshSession() {
  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
  });
}

export function logout(accessToken: string) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    accessToken,
  });
}

export function forgotPassword(input: ForgotPasswordInput) {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: input,
  });
}

export function resetPassword(token: string, input: ResetPasswordInput) {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: {
      token,
      password: input.password,
    },
  });
}

export function verifyEmail(token: string) {
  return apiRequest<ProfileResponse>('/auth/verify-email', {
    method: 'POST',
    body: { token },
  });
}

export function resendVerification(accessToken: string) {
  return apiRequest<MessageResponse>('/auth/resend-verification', {
    method: 'POST',
    accessToken,
  });
}

export function getProfile(accessToken: string) {
  return apiRequest<ProfileResponse>('/auth/me', {
    accessToken,
  });
}

export function updateProfile(accessToken: string, input: UpdateProfileInput) {
  return apiRequest<ProfileResponse>('/auth/me', {
    method: 'PATCH',
    accessToken,
    body: input,
  });
}
