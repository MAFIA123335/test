'use client';

import { motion } from 'framer-motion';
import { ProductCard, ProductCardProps } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridProps {
  products: ProductCardProps[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

const colClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export function ProductGrid({ products, loading, columns = 4 }: ProductGridProps) {
  if (loading) {
    return (
      <div className={`grid ${colClass[columns]} gap-4`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`grid ${colClass[columns]} gap-4`}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
