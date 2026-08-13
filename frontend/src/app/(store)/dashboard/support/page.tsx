'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MessageCircle, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  updatedAt: string;
  _count: { messages: number };
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  OPEN: 'default', PENDING: 'secondary', RESOLVED: 'success', CLOSED: 'outline',
};

export default function SupportPage() {
  const t = useTranslations('support');
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get<{ data: Ticket[] }>('/support')
      .then(r => setTickets(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/support', { subject, message, priority });
      toast({ title: 'Ticket created' });
      setOpen(false);
      setSubject(''); setMessage(''); setPriority('normal');
      load();
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />{t('newTicket')}
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('noTickets')}</p>
        </div>
      ) : (
        tickets.map(ticket => (
          <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
            className="flex items-center gap-4 p-4 border rounded-2xl bg-card hover:border-primary transition-colors cursor-pointer group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{t('ticketNumber')}{ticket.ticketNumber}</span>
                <Badge variant={statusVariant[ticket.status] ?? 'secondary'}>{t(ticket.status as never)}</Badge>
              </div>
              <p className="text-sm line-clamp-1">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ticket.updatedAt)} · {ticket._count.messages} messages</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.div>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('newTicket')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('subject')}</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('low')}</SelectItem>
                  <SelectItem value="normal">{t('normal')}</SelectItem>
                  <SelectItem value="high">{t('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('message')}</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <Button onClick={() => void handleCreate()} disabled={submitting} className="w-full">
              {submitting ? '...' : t('newTicket')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
