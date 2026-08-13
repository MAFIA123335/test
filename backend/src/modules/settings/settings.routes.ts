import { Router, Request, Response } from 'express';
import { settingsService } from './settings.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// Public: site + homepage settings (needed by the storefront).
router.get(
  '/public',
  asyncHandler(async (_req: Request, res: Response) => {
    const [site, homepage, commerce] = await Promise.all([
      settingsService.get('site'),
      settingsService.get('homepage'),
      settingsService.get('commerce'),
    ]);
    return ApiResponse.success(res, { site, homepage, commerce });
  }),
);

// Admin: read + write any setting key.
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => ApiResponse.success(res, await settingsService.getAll())),
);
router.put(
  '/:key',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await settingsService.set(req.params.key, req.body.value ?? req.body), 'Settings saved'),
  ),
);

export const settingsRoutes = router;
