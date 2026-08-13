'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn, formatPrice, getDiscountPercent } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Badge } from '@/components/ui/badge';

export interface ProductCardProps {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  price: number;
  salePrice?: number | null;
  thumbnail?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  brand?: { name: string } | null;
  isFeatured?: boolean;
  stock?: number;
  soldCount?: number;
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  const t = useTranslations('product');
  const { addItem, loading } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const [imageError, setImageError] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const isOnSale = product.salePrice != null && product.salePrice < product.price;
  const discountPercent = isOnSale ? getDiscountPercent(product.price, product.salePrice!) : 0;
  const isOutOfStock = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${product.slug}`}>
          {product.thumbnail && !imageError ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-luxury">
              <ShoppingBag className="h-12 w-12 text-pink-300" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {isOnSale && (
            <Badge className="text-[10px] px-2 py-0.5">-{discountPercent}%</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              {t('featured')}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
              {t('outOfStock')}
            </Badge>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute top-2 end-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => void toggle(product.id)}
            className={cn(
              'p-2 rounded-full shadow-sm transition-colors',
              inWishlist
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/90 dark:bg-black/60 hover:bg-primary hover:text-primary-foreground',
            )}
            aria-label={inWishlist ? t('removeFromWishlist') : t('addToWishlist')}
          >
            <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="p-2 rounded-full bg-white/90 dark:bg-black/60 shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {product.brand && (
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {product.brand.name}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {(product.ratingCount ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3 w-3',
                    star <= Math.round(product.ratingAvg ?? 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground',
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-primary">
              {formatPrice(isOnSale ? product.salePrice! : product.price)}
            </span>
            {isOnSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <button
            onClick={() => void addItem(product.id)}
            disabled={isOutOfStock || loading}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('addToCart')}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
