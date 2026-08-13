import { NotificationType, TicketStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateTicketDto, ReplyDto } from './support.validation';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { generateTicketNumber } from '../../utils/helpers';
import { notificationService } from '../../services/notification.service';

const ticketInclude = {
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { firstName: true, lastName: true, avatar: true, role: true } } },
  },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export class SupportService {
  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId,
        subject: dto.subject,
        priority: dto.priority ?? 'normal',
        messages: {
          create: {
            userId,
            message: dto.message,
            isStaff: false,
            attachments: dto.attachments ?? [],
          },
        },
      },
      include: ticketInclude,
    });

    await notificationService.notifyAdmin({
      type: NotificationType.NEW_TICKET,
      title: 'New support ticket',
      message: `${ticket.ticketNumber}: ${dto.subject}`,
      link: `/admin/support/${ticket.id}`,
    });

    return ticket;
  }

  listForUser(userId: string) {
    return prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getForUser(userId: string, id: string, isAdmin = false) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: ticketInclude });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (!isAdmin && ticket.userId !== userId) throw new ForbiddenError();
    return ticket;
  }

  async reply(userId: string, id: string, dto: ReplyDto, isStaff: boolean) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (!isStaff && ticket.userId !== userId) throw new ForbiddenError();
    if (ticket.status === TicketStatus.CLOSED) throw new ForbiddenError('Ticket is closed');

    await prisma.ticketMessage.create({
      data: { ticketId: id, userId, message: dto.message, isStaff, attachments: dto.attachments ?? [] },
    });

    // Staff reply → ticket pending on customer; customer reply → back to open.
    await prisma.supportTicket.update({
      where: { id },
      data: { status: isStaff ? TicketStatus.PENDING : TicketStatus.OPEN, updatedAt: new Date() },
    });

    if (isStaff) {
      await notificationService.notifyUser(ticket.userId, {
        type: NotificationType.TICKET_REPLY,
        title: 'Support replied',
        message: `We replied to your ticket ${ticket.ticketNumber}.`,
        link: `/dashboard/support/${ticket.id}`,
      });
    } else {
      await notificationService.notifyAdmin({
        type: NotificationType.TICKET_REPLY,
        title: 'Customer replied',
        message: `New reply on ${ticket.ticketNumber}.`,
        link: `/admin/support/${ticket.id}`,
      });
    }

    return this.getForUser(userId, id, isStaff);
  }

  async setStatus(id: string, status: TicketStatus, actorId: string, isAdmin: boolean) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundError('Ticket not found');
    // Customers may only close their own ticket.
    if (!isAdmin) {
      if (ticket.userId !== actorId) throw new ForbiddenError();
      if (status !== TicketStatus.CLOSED) throw new ForbiddenError('You can only close a ticket');
    }
    return prisma.supportTicket.update({ where: { id }, data: { status }, include: ticketInclude });
  }

  adminList(status?: TicketStatus) {
    return prisma.supportTicket.findMany({
      where: status ? { status } : {},
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
    });
  }
}

export const supportService = new SupportService();
