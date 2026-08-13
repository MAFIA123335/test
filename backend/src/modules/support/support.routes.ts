import { Router, Request, Response } from 'express';
import { TicketStatus } from '@prisma/client';
import { supportService } from './support.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createTicketSchema, replySchema, ticketStatusSchema } from './support.validation';

const router = Router();
router.use(authenticate);

// Customer
router.post(
  '/',
  validate({ body: createTicketSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.created(res, await supportService.create(req.user!.id, req.body), 'Ticket created'),
  ),
);
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await supportService.listForUser(req.user!.id)),
  ),
);
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await supportService.getForUser(req.user!.id, req.params.id, req.user!.role === 'ADMIN'),
    ),
  ),
);
router.post(
  '/:id/reply',
  validate({ body: replySchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await supportService.reply(req.user!.id, req.params.id, req.body, req.user!.role === 'ADMIN'),
      'Reply sent',
    ),
  ),
);
router.patch(
  '/:id/status',
  validate({ body: ticketStatusSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await supportService.setStatus(
        req.params.id,
        req.body.status as TicketStatus,
        req.user!.id,
        req.user!.role === 'ADMIN',
      ),
      'Status updated',
    ),
  ),
);

// Admin
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await supportService.adminList(req.query.status as TicketStatus | undefined)),
  ),
);

export const supportRoutes = router;
