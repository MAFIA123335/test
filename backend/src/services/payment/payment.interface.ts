import { PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Payment abstraction layer.
 *
 * Each gateway implements PaymentProvider. New gateways (Stripe, PayPal, local
 * wallets) register themselves in the PaymentRegistry — existing code never
 * changes (Open/Closed Principle). The order flow only depends on this interface.
 */
export interface PaymentContext {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  userId: string;
  customerEmail: string;
}

export interface PaymentResult {
  status: PaymentStatus;
  /** Optional redirect URL for hosted gateways. */
  redirectUrl?: string;
  /** Provider reference / transaction id. */
  reference?: string;
  message?: string;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  /** Initiate a charge. For COD this simply marks the order unpaid/pending. */
  initiate(ctx: PaymentContext): Promise<PaymentResult>;
  /** Verify/confirm a payment (webhook or manual). Optional for offline methods. */
  verify?(reference: string): Promise<PaymentResult>;
}
