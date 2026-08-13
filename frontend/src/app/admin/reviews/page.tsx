'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/star-rating';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  product: { name: string; slug: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ data: { items: Review[]; total: number } }>('/reviews/admin/all', { params: { page, limit } })
      .then(r => { setReviews(r.data.data.items); setTotal(r.data.data.total); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const setApproval = async (id: string, isApproved: boolean) => {
    try {
      await api.patch(`/reviews/admin/${id}/approval`, { isApproved });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved } : r));
      toast({ title: isApproved ? 'Review approved' : 'Review rejected' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Review deleted' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews</h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="border rounded-xl p-4 bg-card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{review.user.firstName} {review.user.lastName}</span>
                    <span className="text-xs text-muted-foreground">{review.user.email}</span>
                    {review.isVerified && <Badge variant="success" className="text-xs">Verified</Badge>}
                    <Badge variant={review.isApproved ? 'success' : 'secondary'} className="text-xs">
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{review.product.name} · {formatDate(review.createdAt)}</p>
                  <StarRating rating={review.rating} size="sm" className="mt-1" />
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!review.isApproved ? (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => void setApproval(review.id, true)}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-600" onClick={() => void setApproval(review.id, false)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(review.id)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
