import { Router, Request, Response } from 'express';
import { couponService } from './coupon.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from './coupon.validation';

const router = Router();

// Customer: validate/apply a coupon against a subtotal
router.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { coupon, discount } = await couponService.evaluate(
      req.body.code,
      req.body.subtotal,
      req.user!.id,
    );
    return ApiResponse.success(
      res,
      { code: coupon.code, type: coupon.type, value: Number(coupon.value), discount },
      'Coupon applied',
    );
  }),
);

// Admin CRUD
router.use(authenticate, requireAdmin);
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => ApiResponse.success(res, await couponService.list())),
);
router.post(
  '/',
  validate({ body: createCouponSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.created(res, await couponService.create(req.body), 'Coupon created'),
  ),
);
router.patch(
  '/:id',
  validate({ body: updateCouponSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await couponService.update(req.params.id, req.body), 'Coupon updated'),
  ),
);
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await couponService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Coupon deleted');
  }),
);

export const couponRoutes = router;
