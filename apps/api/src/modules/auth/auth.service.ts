import type { FastifyInstance, FastifyReply } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';

import { env } from '../../config/env.js';
import {
  resetPasswordEmailHtml,
  sendEmail,
  verificationEmailHtml,
} from '../../lib/email.js';
import { AppError } from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  generateOpaqueToken,
  hashToken,
  refreshTokenTtlSeconds,
} from '../../lib/tokens.js';
import { toPublicUser } from '../users/user.mapper.js';
import { UserModel, type UserDocument } from '../users/user.model.js';
import type { PublicUser } from '../users/user.types.js';
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateProfileBody,
  VerifyEmailBody,
} from './auth.schemas.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_PREFIX = 'auth:refresh:';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = {
  user: PublicUser;
  accessToken: string;
  verificationLink?: string;
};

function refreshKey(userId: string, tokenHash: string): string {
  return `${REFRESH_PREFIX}${userId}:${tokenHash}`;
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    // Path `/` so cookies work through the Next.js same-origin proxy and direct API calls.
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    signed: true,
    maxAge: maxAgeSeconds,
  };
}

function buildVerificationLink(token: string): string | undefined {
  if (env.RESEND_API_KEY) {
    return undefined;
  }

  return `${env.WEB_ORIGIN}/verify-email?token=${token}`;
}

async function signRefreshToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret);
}

async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== 'refresh' || typeof payload.sub !== 'string') {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
    return { sub: payload.sub };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
  }
}

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  private async issueTokens(user: UserDocument, reply: FastifyReply): Promise<AuthTokens> {
    const accessToken = await this.app.jwt.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access' as const,
    });

    const refreshToken = await signRefreshToken(user._id.toString());
    const tokenHash = hashToken(refreshToken);
    const ttl = refreshTokenTtlSeconds(env.JWT_REFRESH_EXPIRES_IN);

    await this.app.tokenStore.set(refreshKey(user._id.toString(), tokenHash), '1', ttl);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions(ttl));

    return { accessToken, refreshToken };
  }

  private clearRefreshCookie(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_COOKIE, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      signed: true,
    });
  }

  async register(input: RegisterBody, reply: FastifyReply): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: input.email }).lean();
    if (existing) {
      throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = generateOpaqueToken();
    const verificationHash = hashToken(verificationToken);

    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'student',
      emailVerified: false,
      emailVerificationTokenHash: verificationHash,
      emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const verifyUrl = `${env.WEB_ORIGIN}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: `Verify your ${env.APP_NAME} email`,
      html: verificationEmailHtml(user.name, verifyUrl),
    });

    const tokens = await this.issueTokens(user, reply);
    return {
      user: toPublicUser(user),
      accessToken: tokens.accessToken,
      verificationLink: buildVerificationLink(verificationToken),
    };
  }

  async login(input: LoginBody, reply: FastifyReply): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = await this.issueTokens(user, reply);
    return { user: toPublicUser(user), accessToken: tokens.accessToken };
  }

  async refresh(reply: FastifyReply, rawCookie?: string): Promise<AuthResult> {
    if (!rawCookie) {
      throw new AppError('Refresh token missing', 401, 'UNAUTHORIZED');
    }

    const unsigned = this.app.unsignCookie(rawCookie);
    const refreshToken = unsigned.valid ? unsigned.value : rawCookie;
    if (!refreshToken) {
      throw new AppError('Refresh token missing', 401, 'UNAUTHORIZED');
    }

    const { sub } = await verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const exists = await this.app.tokenStore.get(refreshKey(sub, tokenHash));
    if (!exists) {
      throw new AppError('Refresh token revoked or expired', 401, 'UNAUTHORIZED');
    }

    await this.app.tokenStore.del(refreshKey(sub, tokenHash));

    const user = await UserModel.findById(sub);
    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    const tokens = await this.issueTokens(user, reply);
    return { user: toPublicUser(user), accessToken: tokens.accessToken };
  }

  async logout(reply: FastifyReply, userId: string, rawCookie?: string): Promise<void> {
    if (rawCookie) {
      const unsigned = this.app.unsignCookie(rawCookie);
      const refreshToken = unsigned.valid ? unsigned.value : rawCookie;
      if (refreshToken) {
        await this.app.tokenStore.del(refreshKey(userId, hashToken(refreshToken)));
      }
    }

    this.clearRefreshCookie(reply);
  }

  async forgotPassword(input: ForgotPasswordBody): Promise<{ message: string }> {
    const user = await UserModel.findOne({ email: input.email });
    const message = 'If that email exists, a reset link has been sent.';

    if (!user) {
      return { message };
    }

    const resetToken = generateOpaqueToken();
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const resetUrl = `${env.WEB_ORIGIN}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: `Reset your ${env.APP_NAME} password`,
      html: resetPasswordEmailHtml(user.name, resetUrl),
    });

    return { message };
  }

  async resetPassword(input: ResetPasswordBody): Promise<{ message: string }> {
    const tokenHash = hashToken(input.token);
    const user = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt +passwordHash');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    user.passwordHash = await hashPassword(input.password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    const pattern = `${REFRESH_PREFIX}${user._id.toString()}:*`;
    const keys = await this.app.tokenStore.keys(pattern);
    if (keys.length > 0) {
      await this.app.tokenStore.del(...keys);
    }

    return { message: 'Password updated successfully.' };
  }

  async verifyEmail(input: VerifyEmailBody): Promise<{ user: PublicUser }> {
    const tokenHash = hashToken(input.token);
    const user = await UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    return { user: toPublicUser(user) };
  }

  async resendVerification(userId: string): Promise<{ message: string; verificationLink?: string }> {
    const user = await UserModel.findById(userId).select(
      '+emailVerificationTokenHash +emailVerificationExpiresAt',
    );
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const verificationToken = generateOpaqueToken();
    user.emailVerificationTokenHash = hashToken(verificationToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await user.save();

    const verifyUrl = `${env.WEB_ORIGIN}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: `Verify your ${env.APP_NAME} email`,
      html: verificationEmailHtml(user.name, verifyUrl),
    });

    return {
      message: 'Verification email sent.',
      verificationLink: buildVerificationLink(verificationToken),
    };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileBody): Promise<PublicUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (input.name) {
      user.name = input.name;
    }

    await user.save();
    return toPublicUser(user);
  }
}
