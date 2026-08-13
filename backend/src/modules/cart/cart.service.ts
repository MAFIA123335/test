import { prisma } from '../../config/prisma';
import { AddToCartDto } from './cart.validation';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { money } from '../../utils/helpers';

const cartInclude = {
  product: {
    include: { images: { orderBy: { sortOrder: 'asc' as const }, take: 1 } },
  },
};

function effectivePrice(price: unknown, salePrice: unknown): number {
  const p = Number(price);
  const s = salePrice == null ? null : Number(salePrice);
  return s != null && s < p ? s : p;
}

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: cartInclude,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = items.map((item) => {
      const price = effectivePrice(item.product.price, item.product.salePrice);
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          nameAr: item.product.nameAr,
          slug: item.product.slug,
          price: Number(item.product.price),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
          effectivePrice: price,
          stock: item.product.stock,
          thumbnail: item.product.thumbnail ?? item.product.images[0]?.url ?? null,
        },
        lineTotal: money(price * item.quantity),
      };
    });

    const subtotal = money(mapped.reduce((sum, i) => sum + i.lineTotal, 0));
    const count = mapped.reduce((sum, i) => sum + i.quantity, 0);

    return { items: mapped, subtotal, count };
  }

  async add(userId: string, dto: AddToCartDto) {
    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive || product.isArchived) throw new NotFoundError('Product not found');

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    const targetQty = (existing?.quantity ?? 0) + dto.quantity;
    if (targetQty > product.stock) throw new BadRequestError('Not enough stock available');

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { quantity: targetQty },
      create: { userId, productId: dto.productId, quantity: dto.quantity },
    });
    return this.getCart(userId);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true },
    });
    if (!item) throw new NotFoundError('Cart item not found');
    if (quantity > item.product.stock) throw new BadRequestError('Not enough stock available');
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCart(userId);
  }

  async remove(userId: string, itemId: string) {
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new NotFoundError('Cart item not found');
    await prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return this.getCart(userId);
  }
}

export const cartService = new CartService();
