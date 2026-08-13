import multer from 'multer';
import { BadRequestError } from '../utils/errors';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** In-memory multer storage — buffers are passed to sharp then Supabase. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new BadRequestError('Only image files are allowed'));
  },
});
