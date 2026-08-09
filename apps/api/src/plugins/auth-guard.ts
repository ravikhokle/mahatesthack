import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../lib/errors.js';
import type { AccessTokenPayload } from '../plugins/security.js';
import type { UserRole } from '../modules/users/user.types.js';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const payload = await request.jwtVerify<AccessTokenPayload>();
    if (payload.type !== 'access') {
      throw new AppError('Invalid access token', 401, 'UNAUTHORIZED');
    }
    request.user = payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
}

export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    await authenticate(request, _reply);
    if (!roles.includes(request.user.role)) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
  };
}
