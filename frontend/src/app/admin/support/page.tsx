'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
  _count: { messages: number };
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  OPEN: 'default', PENDING: 'secondary', RESOLVED: 'success', CLOSED: 'outline',
};

const STATUSES = ['', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    api.get<{ data: Ticket[] }>('/support/admin/all', { params })
      .then(r => setTickets(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s || 'All'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} onClick={() => router.push(`/admin/support/${ticket.id}`)}
            className="flex items-center gap-4 p-4 border rounded-xl bg-card hover:border-primary transition-colors cursor-pointer group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-sm">#{ticket.ticketNumber}</span>
                <Badge variant={statusVariant[ticket.status] ?? 'secondary'} className="text-xs">{ticket.status}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{ticket.priority}</Badge>
              </div>
              <p className="text-sm line-clamp-1">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ticket.user.firstName} {ticket.user.lastName} · {formatDate(ticket.updatedAt)} · {ticket._count.messages} messages
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        ))
      )}
    </div>
  );
}
