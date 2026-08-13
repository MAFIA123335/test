import { Router } from 'express';
import { Request, Response } from 'express';
import { brandService } from './brand.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createBrandSchema, updateBrandSchema } from './brand.validation';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) =>
    ApiResponse.success(res, await brandService.list(false)),
  ),
);
router.get(
  '/slug/:slug',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await brandService.getBySlug(req.params.slug)),
  ),
);
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) =>
    ApiResponse.success(res, await brandService.list(true)),
  ),
);
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createBrandSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.created(res, await brandService.create(req.body), 'Brand created'),
  ),
);
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateBrandSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await brandService.update(req.params.id, req.body), 'Brand updated'),
  ),
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await brandService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Brand deleted');
  }),
);

export const brandRoutes = router;
