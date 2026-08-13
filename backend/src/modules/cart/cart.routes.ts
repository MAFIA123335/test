import { Router, Request, Response } from 'express';
import { cartService } from './cart.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { addToCartSchema, updateCartSchema } from './cart.validation';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await cartService.getCart(req.user!.id)),
  ),
);
router.post(
  '/',
  validate({ body: addToCartSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await cartService.add(req.user!.id, req.body), 'Added to cart'),
  ),
);
router.patch(
  '/:itemId',
  validate({ body: updateCartSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await cartService.updateQuantity(req.user!.id, req.params.itemId, req.body.quantity),
      'Cart updated',
    ),
  ),
);
router.delete(
  '/:itemId',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await cartService.remove(req.user!.id, req.params.itemId), 'Item removed'),
  ),
);
router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(res, await cartService.clear(req.user!.id), 'Cart cleared'),
  ),
);

export const cartRoutes = router;
