import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
  className?: string;
}

const sizeClass = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function StarRating({ rating, max = 5, size = 'md', showValue, count, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass[size],
              i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
            )}
          />
        ))}
      </div>
      {showValue && <span className="text-sm font-medium">{rating.toFixed(1)}</span>}
      {count != null && <span className="text-sm text-muted-foreground">({count})</span>}
    </div>
  );
}
