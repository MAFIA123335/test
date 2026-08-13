'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  isApproved: boolean;
  product: { id: string; name: string; slug: string; thumbnail: string | null };
}

export default function ReviewsPage() {
  const t = useTranslations('review');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get<{ data: Review[] }>('/reviews/me')
      .then(r => setReviews(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (review: Review) => {
    setEditing(review);
    setEditRating(review.rating);
    setEditComment(review.comment ?? '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/reviews/${editing.id}`, { rating: editRating, comment: editComment });
      toast({ title: 'Review updated' });
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Review deleted' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('myReviews')}</h1>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t('noReviews')}</p>
      ) : (
        reviews.map(review => (
          <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-2xl p-4 bg-card space-y-3">
            <div className="flex items-start gap-3">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                {review.product.thumbnail && <Image src={review.product.thumbnail} alt={review.product.name} fill className="object-cover" sizes="56px" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${review.product.slug}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                  {review.product.name}
                </Link>
                <StarRating rating={review.rating} size="sm" />
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(review)} className="h-8 w-8">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => void deleteReview(review.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          </motion.div>
        ))
      )}

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('edit')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setEditRating(s)}>
                  <Star className={`w-6 h-6 ${s <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <Textarea value={editComment} onChange={e => setEditComment(e.target.value)} placeholder={t('commentPlaceholder')} rows={4} />
            <Button onClick={() => void saveEdit()} disabled={saving} className="w-full">
              {saving ? '...' : t('submit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
