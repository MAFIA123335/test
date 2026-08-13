import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId?: string | null;
  forAdmin?: boolean;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Internal notification service (no paid providers). Notifications are stored in
 * the DB and surfaced via the notifications API for both users and admins.
 */
class NotificationService {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        userId: input.userId ?? null,
        forAdmin: input.forAdmin ?? false,
        metadata: input.metadata,
      },
    });
  }

  notifyAdmin(input: Omit<CreateNotificationInput, 'forAdmin' | 'userId'>) {
    return this.create({ ...input, forAdmin: true, userId: null });
  }

  notifyUser(userId: string, input: Omit<CreateNotificationInput, 'forAdmin' | 'userId'>) {
    return this.create({ ...input, userId, forAdmin: false });
  }
}

export const notificationService = new NotificationService();
