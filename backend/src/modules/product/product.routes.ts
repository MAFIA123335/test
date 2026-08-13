import { Router } from 'express';
import { productController } from './product.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  adminProductQuerySchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from './product.validation';

const router = Router();

// Public
router.get('/', validate({ query: productQuerySchema }), asyncHandler(productController.list));
router.get('/slug/:slug', asyncHandler(productController.getBySlug));

// Admin
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  validate({ query: adminProductQuerySchema }),
  asyncHandler(productController.adminList),
);
router.get('/:id', authenticate, requireAdmin, asyncHandler(productController.getById));
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  asyncHandler(productController.create),
);
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateProductSchema }),
  asyncHandler(productController.update),
);
router.post('/:id/archive', authenticate, requireAdmin, asyncHandler(productController.archive));
router.post('/:id/restore', authenticate, requireAdmin, asyncHandler(productController.restore));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(productController.remove));

export const productRoutes = router;
