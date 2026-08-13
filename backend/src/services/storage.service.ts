import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'crypto';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export interface UploadedImage {
  url: string;
  path: string;
}

/**
 * Image storage abstraction over Supabase Storage. Compresses images with sharp
 * before upload. If Supabase is not configured, throws a clear operational error
 * so the rest of the app still boots (useful for local dev without keys).
 */
class StorageService {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (!config.supabase.enabled) {
      throw new AppError('Storage is not configured (SUPABASE_URL / SERVICE_ROLE_KEY missing)', 503);
    }
    if (!this.client) {
      this.client = createClient(config.supabase.url as string, config.supabase.serviceKey as string, {
        auth: { persistSession: false },
      });
    }
    return this.client;
  }

  /** Compress + upload a single image buffer. Returns public URL + storage path. */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    folder = 'products',
  ): Promise<UploadedImage> {
    const client = this.getClient();
    const compressed = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;

    const { error } = await client.storage
      .from(config.supabase.bucket)
      .upload(fileName, compressed, { contentType: 'image/webp', upsert: false });

    if (error) {
      logger.error('Supabase upload failed', error);
      throw new AppError('Image upload failed', 502);
    }

    const { data } = client.storage.from(config.supabase.bucket).getPublicUrl(fileName);
    return { url: data.publicUrl, path: fileName };
  }

  async uploadMany(
    files: { buffer: Buffer; originalname: string }[],
    folder = 'products',
  ): Promise<UploadedImage[]> {
    return Promise.all(files.map((f) => this.uploadImage(f.buffer, f.originalname, folder)));
  }

  /** Delete by storage path (the `path` returned from uploadImage). */
  async deleteImage(path: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client.storage.from(config.supabase.bucket).remove([path]);
    if (error) logger.warn(`Failed to delete storage object ${path}: ${error.message}`);
  }

  /** Extract the storage path from a public URL for deletion. */
  pathFromUrl(url: string): string | null {
    const marker = `/object/public/${config.supabase.bucket}/`;
    const idx = url.indexOf(marker);
    return idx === -1 ? null : url.slice(idx + marker.length);
  }
}

export const storageService = new StorageService();
