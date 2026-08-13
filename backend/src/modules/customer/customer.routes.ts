import { Router, Request, Response } from 'express';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { NotFoundError } from '../../utils/errors';

const router = Router();
router.use(authenticate, requireAdmin);

// List customers with search + pagination
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    const where: Prisma.UserWhereInput = { role: Role.CUSTOMER };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return ApiResponse.paginated(res, items, page, limit, total);
  }),
);

// Customer detail with order history
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        addresses: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) throw new NotFoundError('Customer not found');
    return ApiResponse.success(res, user);
  }),
);

// Enable / disable an account
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: Boolean(req.body.isActive) },
      select: { id: true, isActive: true },
    });
    return ApiResponse.success(res, user, 'Customer status updated');
  }),
);

export const customerRoutes = router;
