// Vercel serverless entry — hands the raw Node req/res to the Express app.
// Express instances are themselves (req, res) handlers, which is exactly what
// @vercel/node invokes, so no serverless wrapper is needed. The database is
// already migrated + seeded, so we just serve requests here.
import { createApp } from '../src/app';

const app = createApp();

export default app;
