import { Router, Request, Response } from 'express';
import { storageService } from '../../services/storage.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { BadRequestError } from '../../utils/errors';

const router = Router();
router.use(authenticate, requireAdmin);

// Single image
router.post(
  '/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError('No image provided');
    const folder = (req.query.folder as string) || 'products';
    const result = await storageService.uploadImage(req.file.buffer, req.file.originalname, folder);
    return ApiResponse.created(res, result, 'Image uploaded');
  }),
);

// Multiple images
router.post(
  '/images',
  upload.array('images', 8),
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw new BadRequestError('No images provided');
    const folder = (req.query.folder as string) || 'products';
    const results = await storageService.uploadMany(files, folder);
    return ApiResponse.created(res, results, 'Images uploaded');
  }),
);

// Delete by public URL or storage path
router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { url, path } = req.body as { url?: string; path?: string };
    const target = path || (url ? storageService.pathFromUrl(url) : null);
    if (!target) throw new BadRequestError('A valid path or url is required');
    await storageService.deleteImage(target);
    return ApiResponse.success(res, null, 'Image deleted');
  }),
);

export const uploadRoutes = router;
