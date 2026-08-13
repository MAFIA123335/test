'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  User, ShoppingBag, Star, Heart, MapPin, MessageCircle,
  Bell, Settings, LogOut, LayoutDashboard,
} from 'lucide-react';

export function DashboardSidebar() {
  const t = useTranslations('dashboard');
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: t('profile'), icon: LayoutDashboard },
    { href: '/dashboard/orders', label: t('orders'), icon: ShoppingBag },
    { href: '/dashboard/reviews', label: t('reviews'), icon: Star },
    { href: '/dashboard/wishlist', label: t('wishlist'), icon: Heart },
    { href: '/dashboard/addresses', label: t('addresses'), icon: MapPin },
    { href: '/dashboard/support', label: t('support'), icon: MessageCircle },
    { href: '/dashboard/notifications', label: t('notifications'), icon: Bell },
  ];

  return (
    <aside className="w-full md:w-56 shrink-0">
      {/* User info */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-luxury flex items-center justify-center text-primary font-bold">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => void logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
