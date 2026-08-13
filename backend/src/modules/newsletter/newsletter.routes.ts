import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';

const subscribeSchema = z.object({ email: z.string().email().toLowerCase() });

const router = Router();

router.post(
  '/subscribe',
  validate({ body: subscribeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.newsletter.upsert({
      where: { email: req.body.email },
      update: { isActive: true },
      create: { email: req.body.email },
    });
    return ApiResponse.created(res, null, 'Subscribed to newsletter');
  }),
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) =>
    ApiResponse.success(res, await prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } })),
  ),
);

export const newsletterRoutes = router;
