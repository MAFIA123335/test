import { Router } from 'express';
import { categoryController } from './category.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();

// Public
router.get('/', asyncHandler(categoryController.list));
router.get('/slug/:slug', asyncHandler(categoryController.getBySlug));

// Admin
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(categoryController.adminList));
router.get('/:id', authenticate, requireAdmin, asyncHandler(categoryController.getById));
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createCategorySchema }),
  asyncHandler(categoryController.create),
);
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateCategorySchema }),
  asyncHandler(categoryController.update),
);
router.delete('/:id', authenticate, requireAdmin, asyncHandler(categoryController.remove));

export const categoryRoutes = router;
