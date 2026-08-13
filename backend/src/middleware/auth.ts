import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { tokenService, AccessTokenPayload } from '../utils/token';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export interface AuthUser extends AccessTokenPayload {
  id: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken as string;
  return null;
}

/** Require a valid access token; attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError('Authentication required');
  const payload = tokenService.verifyAccess(token);
  req.user = { ...payload, id: payload.sub };
  next();
}

/** Attach req.user if a valid token is present, but never block. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = tokenService.verifyAccess(token);
      req.user = { ...payload, id: payload.sub };
    } catch {
      /* ignore invalid token in optional mode */
    }
  }
  next();
}

/** Restrict a route to specific roles (use after authenticate). */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) throw new ForbiddenError('Insufficient permissions');
    next();
  };
}

export const requireAdmin = authorize(Role.ADMIN);
