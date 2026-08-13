import bcrypt from 'bcryptjs';
import { config } from '../config/env';

export const passwordService = {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, config.BCRYPT_SALT_ROUNDS);
  },
  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },
};
