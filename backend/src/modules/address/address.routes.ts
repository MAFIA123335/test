import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { NotFoundError } from '../../utils/errors';

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  country: z.string().min(2),
  city: z.string().min(2),
  state: z.string().optional(),
  street: z.string().min(2),
  building: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) =>
    ApiResponse.success(
      res,
      await prisma.address.findMany({ where: { userId: req.user!.id }, orderBy: { isDefault: 'desc' } }),
    ),
  ),
);

router.post(
  '/',
  validate({ body: addressSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.create({ data: { ...req.body, userId: req.user!.id } });
    return ApiResponse.created(res, address, 'Address added');
  }),
);

router.patch(
  '/:id',
  validate({ body: addressSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) throw new NotFoundError('Address not found');
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.update({ where: { id: req.params.id }, data: req.body });
    return ApiResponse.success(res, address, 'Address updated');
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    return ApiResponse.success(res, null, 'Address deleted');
  }),
);

export const addressRoutes = router;
