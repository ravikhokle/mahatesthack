import { createHash, randomBytes, randomInt } from 'node:crypto';

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Generate a cryptographically secure 6-digit numeric OTP. */
export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenTtlSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    return 60 * 60 * 24 * 7;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 60 * 60 * 24 * 7;
  }
}
