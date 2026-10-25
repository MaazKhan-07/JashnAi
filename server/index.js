/**
 * Express app bootstrap.
 * Exports `app` for testing, starts listening when run directly.
 */
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import config from './config.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import planRouter from './routes/plan.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ── Security ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Body parsing ──
app.use(express.json({ limit: config.jsonLimit }));

// ── Rate limiting ──
app.use('/api/', apiLimiter);

// ── Static files ──
app.use(express.static(join(__dirname, '..', 'public'), {
  etag: true,
  maxAge: config.nodeEnv === 'production' ? '1d' : 0,
}));

// ── API routes ──
app.use(healthRouter);
app.use(planRouter);
app.use(aiRouter);

// ── SPA fallback ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// ── Error handler ──
app.use(errorHandler);

// ── Start server if run directly ──
const isMainModule = process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
   process.argv[1].endsWith('server/index.js'));

if (isMainModule) {
  app.listen(config.port, () => {
    console.log(`\n🎉 Jashn is running at http://localhost:${config.port}`);
    console.log(`   Gemini AI: ${config.geminiApiKey ? '✅ Enabled' : '⚡ Offline mode (no API key)'}`);
    console.log(`   Environment: ${config.nodeEnv}\n`);
  });
}

export default app;
