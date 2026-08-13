import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { config } from '../config/env';

interface ErrorBody {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

/** Translate any thrown error into a consistent JSON response. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): Response {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message, code } = mapPrismaError(err));
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  if (statusCode >= 500) {
    logger.error(err instanceof Error ? err.stack || err.message : String(err));
  }

  const body: ErrorBody = { success: false, message, code, details };
  if (config.isDev && err instanceof Error) body.stack = err.stack;

  return res.status(statusCode).json(body);
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
} {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return { statusCode: 409, message: `Duplicate value for ${target}`, code: 'CONFLICT' };
    }
    case 'P2025':
      return { statusCode: 404, message: 'Record not found', code: 'NOT_FOUND' };
    case 'P2003':
      return { statusCode: 400, message: 'Related record constraint failed', code: 'FK_CONSTRAINT' };
    default:
      return { statusCode: 400, message: 'Database request error', code: err.code };
  }
}
