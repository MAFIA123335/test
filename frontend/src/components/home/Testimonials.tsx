'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  user: { name: string; avatar?: string };
  product: { name: string };
  createdAt: string;
}

const FALLBACK: Testimonial[] = [
  { id: '1', rating: 5, comment: 'Absolutely love the products! My skin has never felt better.', user: { name: 'Sarah M.' }, product: { name: 'Glow Serum' }, createdAt: '' },
  { id: '2', rating: 5, comment: 'Fast shipping and beautiful packaging. Will definitely order again!', user: { name: 'Lina K.' }, product: { name: 'Rose Cream' }, createdAt: '' },
  { id: '3', rating: 5, comment: 'The quality is outstanding. Worth every penny!', user: { name: 'Nour A.' }, product: { name: 'Vitamin C Mask' }, createdAt: '' },
];

export function Testimonials() {
  const t = useTranslations('sections');
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api
      .get<{ data: { reviews: Testimonial[] } }>('/reviews?limit=6&sort=rating')
      .then((r) => { if (r.data.data.reviews.length) setItems(r.data.data.reviews); })
      .catch(() => undefined);
  }, []);

  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  const current = items[idx];

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeader title={t('testimonials')} className="mb-10" />
        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border rounded-2xl p-8 text-center shadow-sm"
            >
              <Quote className="w-8 h-8 text-primary/30 mx-auto mb-4" />
              <div className="flex justify-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < current.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">"{current.comment}"</p>
              <div className="flex items-center justify-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={current.user.avatar} />
                  <AvatarFallback>{current.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-sm">{current.user.name}</p>
                  <p className="text-xs text-muted-foreground">{current.product.name}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border rounded-full p-2 shadow hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border rounded-full p-2 shadow hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex justify-center gap-1.5 mt-6">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
