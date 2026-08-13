'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const t = useTranslations('wishlist');
  const { items, removeItem, moveToCart } = useWishlist();

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h2 className="font-semibold text-lg mb-1">{t('empty')}</h2>
      <p className="text-muted-foreground text-sm mb-6">{t('emptyDesc')}</p>
      <Button asChild><Link href="/products">Shop Now</Link></Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-3 p-4 border rounded-2xl bg-card">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
              {item.product.thumbnail && <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover" sizes="64px" />}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.product.slug}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                {item.product.name}
              </Link>
              <p className="text-sm text-primary font-semibold mt-0.5">
                {formatPrice(item.product.salePrice ?? item.product.price)}
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => void moveToCart(item.productId).then(() => toast({ title: 'Moved to cart' }))}>
                  <ShoppingBag className="w-3.5 h-3.5 mr-1" />{t('moveToCart')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void removeItem(item.productId)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
