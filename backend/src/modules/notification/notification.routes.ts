import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

/** Build the where clause: personal notifications for users, forAdmin ones for admins. */
function scopeFor(req: Request) {
  return req.user!.role === 'ADMIN'
    ? { OR: [{ forAdmin: true }, { userId: req.user!.id }] }
    : { userId: req.user!.id, forAdmin: false };
}

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where = scopeFor(req);
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return ApiResponse.success(res, { items, total, unread, page, limit });
  }),
);

router.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const unread = await prisma.notification.count({ where: { ...scopeFor(req), isRead: false } });
    return ApiResponse.success(res, { unread });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, ...scopeFor(req) },
      data: { isRead: true },
    });
    return ApiResponse.success(res, null, 'Marked as read');
  }),
);

router.patch(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({ where: { ...scopeFor(req), isRead: false }, data: { isRead: true } });
    return ApiResponse.success(res, null, 'All marked as read');
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.deleteMany({ where: { id: req.params.id, ...scopeFor(req) } });
    return ApiResponse.success(res, null, 'Deleted');
  }),
);

// Admin: full feed
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await prisma.notification.findMany({
      where: { forAdmin: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ApiResponse.success(res, items);
  }),
);

export const notificationRoutes = router;
