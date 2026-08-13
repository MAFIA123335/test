import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

/** Simple liveness/readiness payload. */
export function healthCheck(_req: Request, res: Response): Response {
  return ApiResponse.success(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
