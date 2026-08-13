'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const t = useTranslations('wishlist');
  const { items, removeItem, moveToCart } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return (
    <div className="container py-20 text-center">
      <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
      <p className="text-muted-foreground mb-8">Please login to view your wishlist</p>
      <Button asChild><Link href="/login">Login</Link></Button>
    </div>
  );

  if (items.length === 0) return (
    <div className="container py-20 text-center">
      <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">{t('empty')}</h2>
      <p className="text-muted-foreground mb-8">{t('emptyDesc')}</p>
      <Button asChild><Link href="/products">Shop Now</Link></Button>
    </div>
  );

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">{t('title')} ({items.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="border rounded-2xl bg-card overflow-hidden group">
            <div className="relative aspect-square bg-muted overflow-hidden">
              <Link href={`/products/${item.product.slug}`}>
                {item.product.thumbnail && (
                  <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                )}
              </Link>
              <button onClick={() => void removeItem(item.productId)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-black/60 text-destructive hover:bg-destructive hover:text-white transition-colors">
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <Link href={`/products/${item.product.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                {item.product.name}
              </Link>
              <p className="text-primary font-bold text-sm">{formatPrice(item.product.salePrice ?? item.product.price)}</p>
              <Button size="sm" className="w-full" onClick={() => void moveToCart(item.productId).then(() => toast({ title: 'Moved to cart' }))}>
                {t('moveToCart')}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
