import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { categoryRoutes } from '../modules/category/category.routes';
import { brandRoutes } from '../modules/brand/brand.routes';
import { productRoutes } from '../modules/product/product.routes';
import { cartRoutes } from '../modules/cart/cart.routes';
import { couponRoutes } from '../modules/coupon/coupon.routes';
import { orderRoutes } from '../modules/order/order.routes';
import { reviewRoutes } from '../modules/review/review.routes';
import { wishlistRoutes } from '../modules/wishlist/wishlist.routes';
import { supportRoutes } from '../modules/support/support.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { settingsRoutes } from '../modules/settings/settings.routes';
import { uploadRoutes } from '../modules/upload/upload.routes';
import { newsletterRoutes } from '../modules/newsletter/newsletter.routes';
import { statsRoutes } from '../modules/stats/stats.routes';
import { customerRoutes } from '../modules/customer/customer.routes';
import { addressRoutes } from '../modules/address/address.routes';
import { healthCheck } from '../middleware/notFound';

const router = Router();

router.get('/health', healthCheck);

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/uploads', uploadRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/stats', statsRoutes);
router.use('/customers', customerRoutes);
router.use('/addresses', addressRoutes);

export const apiRouter = router;
