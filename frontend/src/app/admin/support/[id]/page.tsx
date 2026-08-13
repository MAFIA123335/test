'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Ticket {
  id: string; ticketNumber: string; subject: string; status: string; priority: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  messages: { id: string; message: string; isStaff: boolean; createdAt: string; user: { firstName: string } }[];
}

const STATUSES = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];

export default function AdminSupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get<{ data: Ticket }>(`/support/admin/${id}`)
      .then(r => setTicket(r.data.data))
      .catch(() => router.push('/admin/support'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post<{ data: Ticket }>(`/support/admin/${id}/reply`, { message: reply });
      setTicket(data.data);
      setReply('');
      toast({ title: 'Reply sent' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const { data } = await api.patch<{ data: Ticket }>(`/support/admin/${id}/status`, { status });
      setTicket(data.data);
      toast({ title: `Status updated to ${status}` });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (!ticket) return null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">#{ticket.ticketNumber} — {ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">{ticket.user.firstName} {ticket.user.lastName} · {ticket.user.email}</p>
        </div>
        <Select value={ticket.status} onValueChange={v => void updateStatus(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Messages</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ticket.messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.isStaff ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.isStaff ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="font-medium text-xs mb-1 opacity-70">{msg.user.firstName} · {formatDate(msg.createdAt)}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} rows={3} />
          <Button onClick={() => void sendReply()} disabled={sending || !reply.trim()}>
            <Send className="w-4 h-4 mr-1.5" />{sending ? 'Sending...' : 'Send Reply'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
