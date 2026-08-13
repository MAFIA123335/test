import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentContext, PaymentProvider, PaymentResult } from '../payment.interface';

/**
 * Cash On Delivery provider. The order is created immediately as PENDING/UNPAID;
 * payment is collected on delivery and confirmed by an admin.
 */
export class CashOnDeliveryProvider implements PaymentProvider {
  readonly method = PaymentMethod.COD;

  async initiate(_ctx: PaymentContext): Promise<PaymentResult> {
    return {
      status: PaymentStatus.UNPAID,
      message: 'Order placed. Payment will be collected on delivery.',
    };
  }
}
