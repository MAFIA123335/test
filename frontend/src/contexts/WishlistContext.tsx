'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface WishlistProduct {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string | null;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
  createdAt: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) { setItems([]); return; }
      const { data } = await api.get<{ data: WishlistItem[] }>('/wishlist');
      setItems(data.data);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const isInWishlist = (productId: string) => items.some((i) => i.productId === productId);

  const addItem = async (productId: string) => {
    setLoading(true);
    try {
      await api.post('/wishlist', { productId });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    await api.delete(`/wishlist/${productId}`);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const toggle = async (productId: string) => {
    if (isInWishlist(productId)) await removeItem(productId);
    else await addItem(productId);
  };

  const moveToCart = async (productId: string) => {
    await api.post(`/wishlist/${productId}/move-to-cart`);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, loading, isInWishlist, addItem, removeItem, toggle, moveToCart, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
