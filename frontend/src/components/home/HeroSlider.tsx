'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/hero1/1600/700',
    titleKey: 'slide1Title',
    subtitleKey: 'slide1Subtitle',
    ctaKey: 'slide1Cta',
    href: '/products',
    bg: 'from-pink-900/60 to-pink-600/30',
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/hero2/1600/700',
    titleKey: 'slide2Title',
    subtitleKey: 'slide2Subtitle',
    ctaKey: 'slide2Cta',
    href: '/products?sort=newest',
    bg: 'from-purple-900/60 to-pink-600/30',
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/hero3/1600/700',
    titleKey: 'slide3Title',
    subtitleKey: 'slide3Subtitle',
    ctaKey: 'slide3Cta',
    href: '/products?onSale=true',
    bg: 'from-rose-900/60 to-orange-600/20',
  },
];

export function HeroSlider() {
  const t = useTranslations('hero');
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <section
      className="relative h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, i) =>
            i === current && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={slide.image}
                  alt={t(slide.titleKey as never)}
                  fill
                  priority={i === 0}
                  className="object-cover"
                  sizes="100vw"
                />
                <div className={cn('absolute inset-0 bg-gradient-to-r', slide.bg)} />
                <div className="absolute inset-0 flex items-center">
                  <div className="container">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="max-w-xl text-white space-y-4"
                    >
                      <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                        {t(slide.titleKey as never)}
                      </h1>
                      <p className="text-lg md:text-xl text-white/80">
                        {t(slide.subtitleKey as never)}
                      </p>
                      <Link
                        href={slide.href}
                        className="inline-flex items-center gap-2 bg-white text-pink-700 px-8 py-3 rounded-full font-semibold hover:bg-pink-50 transition-colors shadow-lg"
                      >
                        {t(slide.ctaKey as never)}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ),
        )}
      </AnimatePresence>

      {/* Controls */}
      <button
        onClick={prev}
        className="absolute start-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass text-white hover:bg-white/30 transition-colors z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute end-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass text-white hover:bg-white/30 transition-colors z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/50',
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
