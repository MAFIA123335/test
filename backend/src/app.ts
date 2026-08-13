import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { config } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { apiLimiter } from './middleware/rateLimiter';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // ── Security ──
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: config.isProd ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
          return cb(null, true);
        }
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(hpp());

  // ── Parsing ──
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(config.COOKIE_SECRET));
  app.use(compression());

  // ── Rate limiting + routes ──
  app.use(config.API_PREFIX, apiLimiter, apiRouter);

  // ── Errors ──
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
