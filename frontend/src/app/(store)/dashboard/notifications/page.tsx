'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<{ data: { items: Notification[] } }>('/notifications')
      .then(r => setItems(r.data.data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const remove = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setItems(prev => prev.filter(n => n.id !== id));
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  const unread = items.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          {unread > 0 && <Badge>{unread}</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="w-4 h-4 mr-1" />{t('markAllRead')}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        items.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`flex gap-3 p-4 border rounded-2xl transition-colors ${!n.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {!n.isRead && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void markRead(n.id)}>
                  <CheckCheck className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(n.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
