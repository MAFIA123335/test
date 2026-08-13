'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface CartProduct {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  stock: number;
  thumbnail: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct;
  lineTotal: number;
}

interface CartSummary {
  items: CartItem[];
  subtotal: number;
  count: number;
}

interface CartContextValue {
  cart: CartSummary;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const empty: CartSummary = { items: [], subtotal: 0, count: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary>(empty);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) { setCart(empty); return; }
      const { data } = await api.get<{ data: CartSummary }>('/cart');
      setCart(data.data);
    } catch {
      setCart(empty);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const addItem = async (productId: string, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await api.post<{ data: CartSummary }>('/cart', { productId, quantity });
      setCart(data.data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    const { data } = await api.delete<{ data: CartSummary }>(`/cart/${itemId}`);
    setCart(data.data);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const { data } = await api.patch<{ data: CartSummary }>(`/cart/${itemId}`, { quantity });
    setCart(data.data);
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart(empty);
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItem, removeItem, updateQuantity, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
