import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export const tokenService = {
  signAccess(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as SignOptions);
  },

  signRefresh(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as SignOptions);
  },

  signReset(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwt.resetSecret, {
      expiresIn: config.jwt.resetExpiresIn,
    } as SignOptions);
  },

  verifyAccess(token: string): AccessTokenPayload {
    return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  },

  verifyRefresh(token: string): RefreshTokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  },

  verifyReset(token: string): { sub: string } {
    return jwt.verify(token, config.jwt.resetSecret) as { sub: string };
  },
};
