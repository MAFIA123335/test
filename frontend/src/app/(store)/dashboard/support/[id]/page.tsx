'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Ticket {
  id: string; ticketNumber: string; subject: string; status: string; priority: string;
  createdAt: string;
  messages: { id: string; message: string; isStaff: boolean; createdAt: string; user: { firstName: string } }[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  OPEN: 'default', PENDING: 'secondary', RESOLVED: 'success', CLOSED: 'outline',
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('support');
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    api.get<{ data: Ticket }>(`/support/${id}`)
      .then(r => setTicket(r.data.data))
      .catch(() => router.push('/dashboard/support'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post<{ data: Ticket }>(`/support/${id}/reply`, { message: reply });
      setTicket(data.data);
      setReply('');
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    try {
      const { data } = await api.patch<{ data: Ticket }>(`/support/${id}/status`, { status: 'CLOSED' });
      setTicket(data.data);
      toast({ title: 'Ticket closed' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (!ticket) return null;

  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">{t('ticketNumber')}{ticket.ticketNumber}</p>
        </div>
        <Badge variant={statusVariant[ticket.status] ?? 'secondary'}>{t(ticket.status as never)}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Conversation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ticket.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isStaff ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.isStaff ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                <p className="font-medium text-xs mb-1 opacity-70">
                  {msg.isStaff ? 'Support' : 'You'} · {formatDate(msg.createdAt)}
                </p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {!isClosed ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea placeholder={t('reply')} value={reply} onChange={e => setReply(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button onClick={() => void sendReply()} disabled={sending || !reply.trim()}>
                <Send className="w-4 h-4 mr-1.5" />{sending ? '...' : t('reply')}
              </Button>
              <Button variant="outline" onClick={() => void closeTicket()}>{t('close')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-4">This ticket is closed.</p>
      )}
    </div>
  );
}
