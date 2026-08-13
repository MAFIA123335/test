import { Router, Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { orderService } from './order.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { checkoutSchema, orderQuerySchema, updateStatusSchema } from './order.validation';

const router = Router();
router.use(authenticate);

// ── Customer ──
router.post(
  '/checkout',
  validate({ body: checkoutSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.created(res, await orderService.checkout(req.user!.id, req.body), 'Order placed'),
  ),
);

router.get(
  '/',
  validate({ query: orderQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { items, total } = await orderService.listForUser(req.user!.id, {
      page,
      limit,
      status: req.query.status as OrderStatus | undefined,
    });
    return ApiResponse.paginated(res, items, page, limit, total);
  }),
);

router.get(
  '/track/:orderNumber',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await orderService.getByNumber(req.user!.id, req.params.orderNumber, req.user!.role === 'ADMIN'),
    ),
  ),
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await orderService.getForUser(req.user!.id, req.params.id)),
  ),
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await orderService.cancelByUser(req.user!.id, req.params.id), 'Order cancelled'),
  ),
);

// ── Admin ──
router.get(
  '/admin/all',
  requireAdmin,
  validate({ query: orderQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { items, total } = await orderService.adminList({
      page,
      limit,
      status: req.query.status as OrderStatus | undefined,
      search: req.query.search as string | undefined,
    });
    return ApiResponse.paginated(res, items, page, limit, total);
  }),
);

router.patch(
  '/admin/:id/status',
  requireAdmin,
  validate({ body: updateStatusSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await orderService.changeStatus(req.params.id, req.body.status, req.body.note),
      'Order status updated',
    ),
  ),
);

export const orderRoutes = router;
