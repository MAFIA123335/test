import { Router, Request, Response } from 'express';
import { reviewService } from './review.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createReviewSchema, updateReviewSchema } from './review.validation';

const router = Router();

// Public: reviews for a product
router.get(
  '/product/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { items, total } = await reviewService.listForProduct(req.params.productId, page, limit);
    return ApiResponse.paginated(res, items, page, limit, total);
  }),
);

// Customer
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await reviewService.listForUser(req.user!.id)),
  ),
);
router.post(
  '/',
  authenticate,
  validate({ body: createReviewSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.created(res, await reviewService.create(req.user!.id, req.body), 'Review submitted'),
  ),
);
router.patch(
  '/:id',
  authenticate,
  validate({ body: updateReviewSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await reviewService.update(req.user!.id, req.params.id, req.body), 'Review updated'),
  ),
);
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await reviewService.remove(req.user!.id, req.params.id, req.user!.role === 'ADMIN');
    return ApiResponse.success(res, null, 'Review deleted');
  }),
);

// Admin
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await reviewService.adminList(page, limit);
    return ApiResponse.paginated(res, items, page, limit, total);
  }),
);
router.patch(
  '/admin/:id/approval',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await reviewService.setApproval(req.params.id, Boolean(req.body.isApproved)), 'Updated'),
  ),
);

export const reviewRoutes = router;
