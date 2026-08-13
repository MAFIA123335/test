import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(3).max(2000),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const replySchema = z.object({
  message: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
export type ReplyDto = z.infer<typeof replySchema>;
