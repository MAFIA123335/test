import { NextFunction, Request, Response } from 'express';

/**
 * Wraps async route handlers so thrown/rejected errors flow to the
 * global error middleware without repetitive try/catch blocks.
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
