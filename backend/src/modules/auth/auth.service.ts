import crypto from 'crypto';
import { NotificationType, Role, User } from '@prisma/client';
import { authRepository, AuthRepository } from './auth.repository';
import { passwordService } from '../../utils/password';
import { tokenService } from '../../utils/token';
import { config } from '../../config/env';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import { notificationService } from '../../services/notification.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './auth.validation';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  locale: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublic(user: User): PublicUser {
  const { password, ...rest } = user;
  void password;
  return rest as PublicUser;
}

function parseDuration(str: string): number {
  const match = /^(\d+)([smhd])$/.exec(str);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 1000;
  return value * factor;
}

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  private async issueTokens(user: User): Promise<AuthResult> {
    const accessToken = tokenService.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const tokenId = crypto.randomUUID();
    const refreshToken = tokenService.signRefresh({ sub: user.id, tokenId });
    const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn));
    await this.repo.saveRefreshToken(user.id, refreshToken, expiresAt);

    return { user: toPublic(user), accessToken, refreshToken };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email is already registered');

    const hashed = await passwordService.hash(dto.password);
    const user = await this.repo.createUser({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      locale: dto.locale ?? 'en',
    });

    await notificationService.notifyAdmin({
      type: NotificationType.NEW_USER,
      title: 'New customer registered',
      message: `${user.firstName} ${user.lastName} (${user.email}) just signed up.`,
      link: '/admin/customers',
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Account is disabled');

    const valid = await passwordService.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedError('Refresh token required');

    const payload = tokenService.verifyRefresh(refreshToken);
    const stored = await this.repo.findRefreshToken(refreshToken);
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.repo.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found');

    // Rotate: revoke old token, issue a fresh pair.
    await this.repo.revokeRefreshToken(refreshToken);
    return this.issueTokens(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.repo.revokeRefreshToken(refreshToken);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return toPublic(user);
  }

  /**
   * Returns a reset token. In production this would be emailed; here it is also
   * returned so the flow is fully testable without a paid email provider.
   */
  async forgotPassword(email: string): Promise<{ resetToken: string | null }> {
    const user = await this.repo.findByEmail(email);
    // Do not reveal whether the email exists.
    if (!user) return { resetToken: null };
    const resetToken = tokenService.signReset(user.id);
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let userId: string;
    try {
      ({ sub: userId } = tokenService.verifyReset(dto.token));
    } catch {
      throw new BadRequestError('Invalid or expired reset token');
    }
    const hashed = await passwordService.hash(dto.password);
    await this.repo.updateUser(userId, { password: hashed });
    await this.repo.revokeAllForUser(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.repo.updateUser(userId, dto);
    return toPublic(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const valid = await passwordService.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestError('Current password is incorrect');
    const hashed = await passwordService.hash(dto.newPassword);
    await this.repo.updateUser(userId, { password: hashed });
    await this.repo.revokeAllForUser(userId);
  }
}

export const authService = new AuthService();
