'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

interface InstaPost { id: string; imageUrl: string; link?: string; }

const FALLBACK: InstaPost[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i),
  imageUrl: `https://picsum.photos/seed/beauty${i}/400/400`,
}));

export function InstagramSection() {
  const t = useTranslations('instagram');
  const [posts, setPosts] = useState<InstaPost[]>(FALLBACK);

  useEffect(() => {
    api.get('/settings/instagram-posts').then(r => {
      if (Array.isArray(r.data?.data) && r.data.data.length) setPosts(r.data.data);
    }).catch(() => {});
  }, []);

  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <Instagram className="w-5 h-5" />
            <span className="font-medium">@beautycenter</span>
          </div>
          <h2 className="text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {posts.slice(0, 6).map((post, i) => (
            <motion.a
              key={post.id}
              href={post.link ?? 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="relative aspect-square overflow-hidden rounded-lg group"
            >
              <Image
                src={post.imageUrl}
                alt="Instagram post"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
