import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { cartService } from '../cart/cart.service';
import { NotFoundError } from '../../utils/errors';

const addSchema = z.object({ productId: z.string().uuid() });

const router = Router();
router.use(authenticate);

// Get wishlist
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, brand: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.success(res, items);
  }),
);

// Add
router.post(
  '/',
  validate({ body: addSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId } },
      update: {},
      create: { userId: req.user!.id, productId },
    });
    return ApiResponse.created(res, item, 'Added to wishlist');
  }),
);

// Remove
router.delete(
  '/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, productId: req.params.productId },
    });
    return ApiResponse.success(res, null, 'Removed from wishlist');
  }),
);

// Move to cart
router.post(
  '/:productId/move-to-cart',
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const cart = await cartService.add(req.user!.id, { productId, quantity: 1 });
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, productId } });
    return ApiResponse.success(res, cart, 'Moved to cart');
  }),
);

export const wishlistRoutes = router;
