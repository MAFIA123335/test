import { Prisma, User } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Data access for users & refresh tokens. Keeps all Prisma queries in one place
 * (Repository Pattern) so services stay persistence-agnostic.
 */
export class AuthRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  createUser(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  // ── refresh tokens ──
  saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  revokeRefreshToken(token: string) {
    return prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  }

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  }
}

export const authRepository = new AuthRepository();
