import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { config } from '../../config/env';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function getRefreshToken(req: Request): string | undefined {
  return (req.cookies?.[REFRESH_COOKIE] as string) || (req.body?.refreshToken as string) || undefined;
}

export class AuthController {
  async register(req: Request, res: Response): Promise<Response> {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.created(res, result, 'Account created successfully');
  }

  async login(req: Request, res: Response): Promise<Response> {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.success(res, result, 'Logged in successfully');
  }

  async refresh(req: Request, res: Response): Promise<Response> {
    const token = getRefreshToken(req);
    const result = await authService.refresh(token as string);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.success(res, result, 'Token refreshed');
  }

  async logout(req: Request, res: Response): Promise<Response> {
    await authService.logout(getRefreshToken(req));
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return ApiResponse.success(res, null, 'Logged out');
  }

  async me(req: Request, res: Response): Promise<Response> {
    const user = await authService.me(req.user!.id);
    return ApiResponse.success(res, user);
  }

  async forgotPassword(req: Request, res: Response): Promise<Response> {
    const result = await authService.forgotPassword(req.body.email);
    return ApiResponse.success(res, result, 'If the email exists, a reset link has been sent');
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    await authService.resetPassword(req.body);
    return ApiResponse.success(res, null, 'Password has been reset');
  }

  async updateProfile(req: Request, res: Response): Promise<Response> {
    const user = await authService.updateProfile(req.user!.id, req.body);
    return ApiResponse.success(res, user, 'Profile updated');
  }

  async changePassword(req: Request, res: Response): Promise<Response> {
    await authService.changePassword(req.user!.id, req.body);
    return ApiResponse.success(res, null, 'Password changed');
  }
}

export const authController = new AuthController();
