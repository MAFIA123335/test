import { Router, Request, Response } from 'express';
import { statsService } from './stats.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

router.get(
  '/dashboard',
  asyncHandler(async (_req: Request, res: Response) => ApiResponse.success(res, await statsService.dashboard())),
);
router.get(
  '/overview',
  asyncHandler(async (_req: Request, res: Response) => ApiResponse.success(res, await statsService.overview())),
);
router.get(
  '/sales',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await statsService.monthlySales(Number(req.query.months) || 12)),
  ),
);
router.get(
  '/top-products',
  asyncHandler(async (_req: Request, res: Response) => ApiResponse.success(res, await statsService.topProducts())),
);

export const statsRoutes = router;
