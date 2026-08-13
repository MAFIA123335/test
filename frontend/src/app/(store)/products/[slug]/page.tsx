'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Share2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '@/components/ui/star-rating';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn, formatPrice, getDiscountPercent } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface ProductImage { id: string; url: string; alt: string | null; }
interface Review {
  id: string; rating: number; comment: string | null; createdAt: string;
  user: { firstName: string; lastName: string; avatar: string | null };
}
interface Product {
  id: string; name: string; nameAr: string | null; slug: string;
  description: string; descriptionAr: string | null;
  sku: string; price: number; salePrice: number | null;
  stock: number; thumbnail: string | null;
  ratingAvg: number; ratingCount: number; soldCount: number;
  isFeatured: boolean; isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  images: ProductImage[];
  tags: { tag: { id: string; name: string; slug: string } }[];
  reviews: Review[];
  related: Product[];
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { addItem, loading: cartLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get<{ data: Product }>(`/products/slug/${slug}`)
      .then(r => { setProduct(r.data.data); setActiveImage(0); })
      .catch(() => router.push('/404'))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const images = product.images.length > 0 ? product.images : [{ id: '0', url: product.thumbnail ?? '', alt: product.name }];
  const isOnSale = product.salePrice != null && product.salePrice < product.price;
  const effectivePrice = isOnSale ? product.salePrice! : product.price;
  const discountPercent = isOnSale ? getDiscountPercent(product.price, product.salePrice!) : 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    try {
      await addItem(product.id, quantity);
      toast({ title: t('addedToCart'), description: product.name });
    } catch (e: unknown) {
      toast({ title: tCommon('error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => router.push('/')} className="hover:text-primary">{tCommon('home')}</button>
        <span>/</span>
        <button onClick={() => router.push('/products')} className="hover:text-primary">{t('products')}</button>
        {product.category && (
          <>
            <span>/</span>
            <button onClick={() => router.push(`/categories/${product.category!.slug}`)} className="hover:text-primary">
              {product.category.name}
            </button>
          </>
        )}
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {images[activeImage]?.url ? (
                  <Image src={images[activeImage].url} alt={images[activeImage].alt ?? product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                ) : (
                  <div className="w-full h-full bg-gradient-luxury flex items-center justify-center">
                    <ShoppingBag className="w-20 h-20 text-pink-300" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveImage(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)} className={cn('relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors', i === activeImage ? 'border-primary' : 'border-transparent')}>
                  <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && <p className="text-sm font-medium text-primary uppercase tracking-widest">{product.brand.name}</p>}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-3">
            <StarRating rating={product.ratingAvg} showValue count={product.ratingCount} />
            <span className="text-sm text-muted-foreground">· {product.soldCount} sold</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(effectivePrice)}</span>
            {isOnSale && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <Badge>-{discountPercent}%</Badge>
              </>
            )}
          </div>

          {product.stock > 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {product.stock <= 5 ? t('lowStock', { count: product.stock }) : t('inStock')}
            </p>
          ) : (
            <p className="text-sm text-destructive font-medium">{t('outOfStock')}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t('quantity')}:</span>
            <div className="flex items-center border rounded-full overflow-hidden">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={() => void handleAddToCart()} disabled={product.stock === 0 || cartLoading}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              {t('addToCart')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => void toggle(product.id)} className={cn(inWishlist && 'text-primary border-primary')}>
              <Heart className={cn('w-5 h-5', inWishlist && 'fill-current')} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => void navigator.share?.({ title: product.name, url: window.location.href })}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Meta */}
          <div className="space-y-1 text-sm text-muted-foreground border-t pt-4">
            <p><span className="font-medium text-foreground">{t('sku')}:</span> {product.sku}</p>
            {product.category && <p><span className="font-medium text-foreground">{t('category')}:</span> {product.category.name}</p>}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {product.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-16">
        <TabsList>
          <TabsTrigger value="description">{t('description')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('reviews')} ({product.ratingCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6 prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6 space-y-4">
          {product.reviews.length === 0 ? (
            <p className="text-muted-foreground">{t('noReviews')}</p>
          ) : (
            product.reviews.map(review => (
              <div key={review.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.user.firstName} {review.user.lastName}</span>
                    <Badge variant="success" className="text-xs">Verified</Badge>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Related */}
      {product.related?.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">{t('relatedProducts')}</h2>
          <ProductGrid products={product.related} />
        </div>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
