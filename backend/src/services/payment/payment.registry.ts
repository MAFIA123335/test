import { PaymentMethod } from '@prisma/client';
import { PaymentProvider } from './payment.interface';
import { CashOnDeliveryProvider } from './providers/cod.provider';
import { BadRequestError } from '../../utils/errors';

/**
 * Registry / factory for payment providers. To add a gateway:
 *   1. Implement PaymentProvider in providers/.
 *   2. register(new MyProvider()) below.
 * No other code changes are required.
 */
class PaymentRegistry {
  private providers = new Map<PaymentMethod, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.providers.set(provider.method, provider);
  }

  get(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) throw new BadRequestError(`Payment method "${method}" is not supported`);
    return provider;
  }

  supported(): PaymentMethod[] {
    return [...this.providers.keys()];
  }
}

export const paymentRegistry = new PaymentRegistry();

// Register available providers (free/offline only for now).
paymentRegistry.register(new CashOnDeliveryProvider());
// Future: paymentRegistry.register(new StripeProvider());
