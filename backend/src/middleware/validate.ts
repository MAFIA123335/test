import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validation middleware factory. Validates and *replaces* req.body/query/params
 * with the parsed (typed, coerced) result.
 */
export const validate =
  (schema: { body?: Schema; query?: Schema; params?: Schema }) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) Object.assign(req.query, schema.query.parse(req.query));
      if (schema.params) Object.assign(req.params, schema.params.parse(req.params));
      next();
    } catch (err) {
      next(err);
    }
  };
